"""`kedro_viz.data_access.repositories.tags` defines repository to
centralise access to tags data."""

from typing import Iterable, List, Set

from kedro_viz.models.flowchart.named_entities import Tag


class TagsRepository:
    def __init__(self):
        self.tags_set: Set[Tag] = set()

    def add_tags(self, tags: Iterable[str]):
        self.tags_set.update([Tag(id=tag_id) for tag_id in tags])

    def as_list(self) -> List[Tag]:
        return list(sorted(self.tags_set, key=lambda t: t.id))
