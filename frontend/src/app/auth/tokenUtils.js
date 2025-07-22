// Hàm kiểm tra access token hết hạn (giả sử JWT)
export function isTokenExpired(token) {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (!payload.exp) return false;
    return Date.now() / 1000 > payload.exp;
  } catch (e) {
    return true;
  }
}
