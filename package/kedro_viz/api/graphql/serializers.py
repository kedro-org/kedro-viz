"""`kedro_viz.api.graphql.serializers` defines serializers to create strawberry types
from the underlying domain models."""

from __future__ import annotations

import json
from collections import defaultdict
from typing import Dict, Iterable, List, Optional, cast

from sklearn.neighbors import KernelDensity
from .types import RunList, RunsMetadata

from strawberry import ID

from kedro_viz.models.experiment_tracking import RunModel, TrackingDatasetModel, UserRunDetailsModel

# from .types import Run


def format_run(
    run_id: str, run_blob: Dict, user_run_details: Optional[UserRunDetailsModel] = None
) -> RunList:
    """Convert blob data in the correct Run format.
    Args:
        run_id: ID of the run to fetch
        run_blob: JSON blob of run metadata
        user_run_details: The user run details associated with this run
    Returns:
        Run object
    """
    git_data = run_blob.get("git")
    bookmark = user_run_details.bookmark if user_run_details else False
    title = (
        user_run_details.title
        if user_run_details and user_run_details.title
        else run_id
    )
    notes = (
        user_run_details.notes if user_run_details and user_run_details.notes else ""
    )
    run = RunList(
        bookmark=bookmark,
        git_sha=git_data.get("commit_sha") if git_data else None,
        id=ID(run_id),
        notes=notes,
        title=title,
    )
    return run


def format_runs(
    runs: Iterable[RunModel],
    user_run_details: Optional[Dict[str, UserRunDetailsModel]] = None,
) -> List[RunList]:
    """Format a list of RunModel objects into a list of GraphQL Run.

    Args:
        runs: The collection of RunModels to format.
        user_run_details: the collection of user_run_details associated with the given runs.
    Returns:
        The list of formatted Runs.
    """
    if not runs:  # it could be None in case the db isn't there.
        return []
    return [
        format_run(
            run.id,
            json.loads(cast(str, run.blob)),
            user_run_details.get(run.id) if user_run_details else None,
        )    for run in runs
    ]


def format_runs_metadata(
    runs: Iterable[RunModel],
    user_run_details: Optional[Dict[str, UserRunDetailsModel]] = None,
) -> RunsMetadata:
    """Format a list of RunModel objects into a list of GraphQL Run.

    Args:
        runs: The collection of RunModels to format.
        user_run_details: the collection of user_run_details associated with the given runs.
    Returns:
        The list of formatted Runs.
    """
    runs_metadata = defaultdict(list)

    if not runs:  # it could be None in case the db isn't there.
        return {}
    for run in runs:
        run_blob = json.loads(cast(str, run.blob))
        current_user_run_details = user_run_details.get(run.id) if user_run_details else None
        git_data = run_blob.get("git")
        bookmark = current_user_run_details.bookmark if current_user_run_details else False
        title = (
            current_user_run_details.title
            if current_user_run_details and current_user_run_details.title
            else run.id
            )
        notes = (
                current_user_run_details.notes if current_user_run_details and current_user_run_details.notes else ""
            )
        runs_metadata['author'].append(run_blob.get('username'))
        runs_metadata['bookmark'].append(bookmark) 
        runs_metadata['git_branch'].append(git_data.get("branch") if git_data else None)
        runs_metadata['git_sha'].append(git_data.get("commit_sha") if git_data else None)
        runs_metadata['id'].append(ID(run.id))
        runs_metadata['notes'].append(notes)
        runs_metadata['run_command'].append(run_blob.get("cli", {}).get("command_path"))
        runs_metadata['title'].append(title)

    return RunsMetadata(
        author=runs_metadata['author'],
        bookmark = runs_metadata['bookmark'],
        git_branch=runs_metadata['git_branch'],
        git_sha=runs_metadata['git_sha'],
        id=runs_metadata['id'],
        notes = runs_metadata['notes'],
        run_command=runs_metadata['run_command'],
        title = runs_metadata['title'])


def format_run_tracking_data(
    all_tracking_data: TrackingDatasetModel, run_ids: List[ID]
) -> List:
    """Convert tracking data in the front-end format.

    Args:
        tracking_data: JSON blob of tracking data for selected runs
    Returns:
        Dictionary with formatted tracking data for selected runs
    """

    

    formatted_tracking_dataset= defaultdict(list)
    for tracking_data in all_tracking_data:
        tracking_keys = set()
        dataset_name = tracking_data.dataset_name 
        runs = {run_id: tracking_data.runs[run_id] for run_id in run_ids}
        formatted_tracking_runs= defaultdict(list)
        run_index = 0
        for _, run_data in runs.items():
                for key, value in run_data.items():
                    if key in tracking_keys:
                        formatted_tracking_runs[key].append(value)
                    else: 
                        for _ in range(run_index):
                            formatted_tracking_runs[key].append(None)
                        formatted_tracking_runs[key].append(value)
                        tracking_keys.add(key)
                for key in tracking_keys:
                    if len(formatted_tracking_runs[key]) < run_index+1:
                        formatted_tracking_runs[key].append(None)
                run_index=run_index+1                        
                    
        
        formatted_tracking_dataset[dataset_name].append(formatted_tracking_runs)      
    
    return [formatted_tracking_dataset]
