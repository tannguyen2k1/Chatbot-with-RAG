import re
import unicodedata
import joblib
from pathlib import Path
from dataclasses import dataclass

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.svm import LinearSVC
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import confusion_matrix, classification_report, accuracy_score
from sklearn.pipeline import Pipeline

ASSETS_DIR = Path(__file__).parent.parent / "assets"
MODEL_DIR = Path(__file__).parent / "models"
DATASET_FILE = ASSETS_DIR / "intent_dataset.txt"
MODEL_FILE = MODEL_DIR / "intent_classifier.joblib"

MODEL_DIR.mkdir(parents=True, exist_ok=True)

TFIDF_PARAMS = {"ngram_range": (1, 3), "max_features": 7000}
SVC_PARAMS = {"C": 2.0, "loss": "hinge", "dual": "auto", "max_iter": 5000, "class_weight": {0: 1, 1: 2.5}, "random_state": 42}
THRESHOLD_SEARCH = [-0.5, -0.3, -0.2, -0.1, 0.0]


def normalize_text(text: str) -> str:
    text = str(text).strip().lower()
    text = unicodedata.normalize("NFD", text)
    text = "".join(ch for ch in text if unicodedata.category(ch) != "Mn")
    text = re.sub(r"\s+", " ", text)
    return text


def add_features(text: str) -> str:
    text_lower = text.lower().strip()
    words = text_lower.split()
    num_words = len(words)
    num_chars = len(text_lower)
    features = []

    if num_words <= 2:
        features.append("VERY_SHORT")
    elif num_words <= 4:
        features.append("SHORT")
    elif num_words <= 7:
        features.append("MEDIUM")
    else:
        features.append("LONG")

    if text.islower():
        features.append("ALL_LOWERCASE")
    if text.isupper():
        features.append("ALL_UPPERCASE")
    upper_count = sum(1 for c in text if c.isupper())
    if upper_count > 0 and upper_count / max(num_chars, 1) > 0.5:
        features.append("MOSTLY_UPPERCASE")

    if num_words >= 2:
        for i in range(num_words - 1):
            if words[i] == words[i + 1] and len(words[i]) <= 4:
                features.append("REPEATING_SHORT_WORD")
                break
        unique_words = set(words)
        if len(unique_words) == 1 and num_words >= 2:
            features.append("SINGLE_REPEATING_WORD")
        elif len(unique_words) <= 2 and num_words >= 3:
            features.append("FEW_REPEATING_WORDS")

    if re.search(r"(.)\1{2,}", text_lower):
        features.append("REPEATING_CHAR_IN_WORD")

    short_alpha_words = [w for w in words if len(w) <= 3 and re.match(r"^[a-zA-Zà-ỹ]+$", w)]
    if len(short_alpha_words) == num_words and num_words >= 2:
        features.append("ALL_SHORT_ALPHA_WORDS")

    if "?" in text:
        features.append("HAS_QUESTION_MARK")
    if "!" in text:
        features.append("HAS_EXCLAMATION")
    punct_count = sum(1 for c in text if c in ".,;:!?")
    if punct_count == 0:
        features.append("NO_PUNCTUATION")

    if re.search(r"\d", text):
        features.append("HAS_DIGITS")
    else:
        features.append("NO_DIGITS")

    question_patterns = [
        r"\blà gì\b", r"\blà sao\b", r"\blàm sao\b", r"\btại sao\b",
        r"\bthế nào\b", r"\bcách nào\b", r"\bnhư thế nào\b",
        r"\bcó nên\b", r"\bcó cần\b", r"\bcó cách\b",
        r"\bnên dùng\b", r"\bnên chọn\b", r"\bnên học\b",
        r"\bgiải thích\b", r"\bhướng dẫn\b", r"\btìm hiểu\b",
        r"\bcách\s+\w", r"\bviết\b", r"\bcode\b",
        r"\blỗi\b", r"\bbug\b", r"\bkhông chạy\b", r"\bkhông được\b",
        r"\bsao không\b", r"\bkhông hiểu\b", r"\bchưa hiểu\b",
    ]
    if any(re.search(p, text_lower) for p in question_patterns):
        features.append("HAS_QUESTION_PATTERN")

    if num_words >= 2:
        last_word = words[-1]
        if last_word in ["không", "ko", "khong", "chưa", "chua", "sao", "đâu", "dau", "nào", "nao"]:
            features.append("ENDS_WITH_QUESTION_WORD")

    goodbye_patterns = [
        r"\bcảm ơn\b", r"\bthanks?\b", r"\bcám ơn\b", r"\bbye\b",
        r"\btạm biệt\b", r"\bchào\b", r"\bhello\b", r"\bhi\b", r"\bhey\b",
        r"\bđược rồi\b", r"\bhiểu rồi\b", r"\brõ rồi\b", r"\bok\b",
        r"\bđi đây\b", r"\bnghỉ đây\b", r"\bhẹn gặp\b",
        r"\bthôi nhé\b", r"\bthôi nha\b",
    ]
    if any(re.search(p, text_lower) for p in goodbye_patterns):
        features.append("HAS_GOODBYE_PATTERN")

    first_word = words[0].lower() if num_words >= 1 else ""
    if first_word in [
        "cách", "hướng", "tạo", "viết", "xây", "thiết", "cài",
        "cấu", "chạy", "deploy", "build", "setup", "config",
    ]:
        features.append("STARTS_IMPERATIVE")

    return " ".join(features) if features else "NO_SPECIAL_FEATURES"


def load_dataset() -> pd.DataFrame:
    df = pd.read_csv(DATASET_FILE)
    if "text" in df.columns and "text_norm" not in df.columns:
        df["text_norm"] = df["text"].apply(normalize_text)
    return df.dropna(subset=["text_norm", "need_context"]).drop_duplicates(subset=["text_norm"]).reset_index(drop=True)


def train_and_evaluate(visualize: bool = False):
    data = load_dataset()
    x = data["text_norm"]
    y = data["need_context"]

    x_train, x_test, y_train, y_test = train_test_split(
        x, y, test_size=0.2, random_state=42, stratify=y
    )

    x_train_enhanced = x_train + " [SEP] " + x_train.apply(add_features)
    x_test_enhanced = x_test + " [SEP] " + x_test.apply(add_features)

    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(**TFIDF_PARAMS)),
        ("clf", LinearSVC(**SVC_PARAMS)),
    ])

    pipeline.fit(x_train_enhanced, y_train)
    scores_test = pipeline.decision_function(x_test_enhanced)

    print("[Query Classifier] Rebuild with Feature Engineering + Threshold Tuning")
    print(f"\n--- Threshold Tuning (target: minimize FN, maximize recall label 1) ---")
    print(f"{'Threshold':>10}  {'Acc':>7}  {'Precision0':>10}  {'Recall0':>8}  {'Precision1':>10}  {'Recall1':>8}  {'FN':>4}  {'FP':>4}")
    print("-" * 75)

    best_threshold = 0.0
    best_recall1 = 0.0
    best_scores = None

    for thresh in THRESHOLD_SEARCH:
        y_pred_t = np.where(scores_test >= thresh, 1, 0)
        cm_t = confusion_matrix(y_test, y_pred_t)
        tp = cm_t[1, 1]
        fn = cm_t[1, 0]
        fp = cm_t[0, 1]
        tn = cm_t[0, 0]
        prec0 = tn / (tn + fn) if (tn + fn) > 0 else 0
        rec0 = tn / (tn + fp) if (tn + fp) > 0 else 0
        prec1 = tp / (tp + fp) if (tp + fp) > 0 else 0
        rec1 = tp / (tp + fn) if (tp + fn) > 0 else 0
        acc = (tp + tn) / (tp + tn + fp + fn)
        print(f"{thresh:>+10.1f}  {acc:>7.4f}  {prec0:>10.4f}  {rec0:>8.4f}  {prec1:>10.4f}  {rec1:>8.4f}  {fn:>4d}  {fp:>4d}")
        if rec1 > best_recall1 or (rec1 == best_recall1 and fp < (cm_t[0, 1] if best_scores is not None else 9999)):
            best_recall1 = rec1
            best_threshold = thresh
            best_scores = cm_t

    print("-" * 75)
    print(f">>> Best threshold: {best_threshold}  (Recall-1: {best_recall1:.4f})")

    cm = confusion_matrix(y_test, np.where(scores_test >= best_threshold, 1, 0))
    acc = accuracy_score(y_test, np.where(scores_test >= best_threshold, 1, 0))
    print(f"\nAccuracy: {acc:.4f}")
    print(f"                 Predicted")
    print(f"                 0      1")
    print(f"Actual 0   {cm[0,0]:>5}  {cm[0,1]:>5}")
    print(f"       1   {cm[1,0]:>5}  {cm[1,1]:>5}")
    print(f"\n{classification_report(y_test, np.where(scores_test >= best_threshold, 1, 0), digits=4)}")
    import sys; sys.stdout.flush()

    x_full_enhanced = x + " [SEP] " + x.apply(add_features)
    pipeline.fit(x_full_enhanced, y)
    joblib.dump((pipeline, best_threshold), MODEL_FILE)

    return pipeline, best_threshold


@dataclass
class QueryClassification:
    needs_context: bool
    reason: str
    category: str


class QueryClassifier:
    def __init__(self, pipeline=None, threshold: float = 0.0):
        self._pipeline = pipeline
        self._threshold = threshold

    def classify(self, query: str) -> QueryClassification:
        q_norm = normalize_text(query)
        features = add_features(q_norm)
        enhanced = q_norm + " [SEP] " + features
        score = self._pipeline.decision_function([enhanced])[0]
        pred = 1 if score >= self._threshold else 0

        if pred == 0:
            return QueryClassification(
                needs_context=False,
                reason=f"Khong can ngon ngu - diem: {score:+.4f}",
                category="no_context",
            )
        return QueryClassification(
            needs_context=True,
            reason=f"Can ngon ngu tu tai lieu - diem: {score:+.4f}",
            category="contextual",
        )


def _load_or_train():
    result = train_and_evaluate()
    if isinstance(result, tuple):
        return result
    return result, 0.0


_classifier: QueryClassifier | None = None


def get_query_classifier() -> QueryClassifier:
    global _classifier
    if _classifier is None:
        pipeline, threshold = _load_or_train()
        _classifier = QueryClassifier(pipeline, threshold)
    return _classifier


if __name__ == "__main__":
    train_and_evaluate()

    pipeline, threshold = train_and_evaluate()
    classifier = QueryClassifier(pipeline, threshold)

    tests = [
        ("hí hí", 0),
        ("haha", 0),
        ("cảm ơn bạn", 0),
        ("cách cài docker", 1),
        ("rest api là gì", 1),
    ]

    print("\n[Query Classifier] Inference Test:")
    for text, expected in tests:
        result = classifier.classify(text)
        status = "OK" if result.needs_context == bool(expected) else "FAIL"
        print(f"  [{status}] '{text}' -> {result.needs_context} ({result.reason})")
    import sys; sys.stdout.flush()
