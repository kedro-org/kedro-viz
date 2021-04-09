from dataclasses import dataclass, field


@dataclass(frozen=True)
class GenericAPIResponse:
    id: str
    name: str = field(init=False)

    def __post_init__(self):
        self.name = _pretty_name(self.id)
