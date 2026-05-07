import asyncio
import time
import uuid
from datetime import datetime
from typing import Optional, List

from schemas.ingestion import IngestionJob, JobStatus


_INGESTION_PERMISSION_CACHE: dict[int, tuple[bool, float]] = {}
_PERMISSION_CACHE_TTL = 30.0


class IngestionJobService:
    def __init__(self):
        self._jobs: dict[str, IngestionJob] = {}
        self._lock = asyncio.Lock()

    async def _check_ingestion_permission(self, user_id: int) -> bool:
        now = time.monotonic()
        cached = _INGESTION_PERMISSION_CACHE.get(user_id)
        if cached is not None and (now - cached[1]) < _PERMISSION_CACHE_TTL:
            return cached[0]

        from services.rbac_helper import ensure_permission_global
        try:
            await ensure_permission_global(user_id, "ingestion", "view")
            _INGESTION_PERMISSION_CACHE[user_id] = (True, now)
            return True
        except Exception:
            _INGESTION_PERMISSION_CACHE[user_id] = (False, now)
            return False

    async def create_job(
        self,
        source_type: str,
        filename: Optional[str] = None,
        collection_name: Optional[str] = None,
        created_by: Optional[str] = None,
    ) -> IngestionJob:
        job_id = str(uuid.uuid4())
        job = IngestionJob(
            job_id=job_id,
            status=JobStatus.PENDING,
            source_type=source_type,
            filename=filename,
            collection_name=collection_name,
            created_by=created_by,
        )
        async with self._lock:
            self._jobs[job_id] = job
        return job

    async def get_job(self, job_id: str) -> Optional[IngestionJob]:
        async with self._lock:
            return self._jobs.get(job_id)

    async def get_active_jobs(self) -> List[IngestionJob]:
        async with self._lock:
            return [
                j for j in self._jobs.values()
                if j.status in (JobStatus.PENDING, JobStatus.PROCESSING)
            ]

    async def update_job(
        self,
        job_id: str,
        status: Optional[JobStatus] = None,
        result=None,
        error: Optional[str] = None,
    ) -> Optional[IngestionJob]:
        async with self._lock:
            job = self._jobs.get(job_id)
            if job is None:
                return None
            if status is not None:
                job.status = status
            if result is not None:
                job.result = result
            if error is not None:
                job.error = error
            job.updated_at = datetime.utcnow()
            return job

    async def run_job(self, job_id: str, coro):
        await self.update_job(job_id, status=JobStatus.PROCESSING)
        try:
            result = await coro
            await self.update_job(job_id, status=JobStatus.COMPLETED, result=result)
        except Exception as e:
            await self.update_job(job_id, status=JobStatus.FAILED, error=str(e))


ingestion_job_service = IngestionJobService()
