from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.services.experiment_service import experiment_service
from app.schemas.experiment import ExperimentRead, ExperimentDetailRead, ExperimentResultRead

router = APIRouter(tags=["experiments"])

@router.post("/experiments/run", response_model=ExperimentDetailRead)
async def run_experiment(name: Optional[str] = Query("Recovery Outcome Evaluation & Baseline Comparison"), db: AsyncSession = Depends(get_db)):
    return await experiment_service.run_experiment(db, name=name)

@router.get("/experiments/latest", response_model=ExperimentDetailRead)
async def get_latest_experiment(db: AsyncSession = Depends(get_db)):
    return await experiment_service.get_latest_experiment(db)

@router.get("/experiments/{experiment_id}", response_model=ExperimentDetailRead)
async def get_experiment(experiment_id: str, db: AsyncSession = Depends(get_db)):
    exp = await experiment_service.get_experiment_by_id(db, experiment_id)
    if not exp:
        return await experiment_service.get_latest_experiment(db)
    return exp

@router.get("/experiments/{experiment_id}/results", response_model=List[ExperimentResultRead])
async def get_experiment_results(experiment_id: str, db: AsyncSession = Depends(get_db)):
    exp = await experiment_service.get_experiment_by_id(db, experiment_id)
    if not exp:
        exp = await experiment_service.get_latest_experiment(db)
    return exp.results
