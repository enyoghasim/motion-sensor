from datetime import datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field

SpaceIconKey = Literal[
    "Home01Icon",
    "Sofa01Icon",
    "BedDoubleIcon",
    "KitchenUtensilsIcon",
    "Bathtub01Icon",
    "GarageIcon",
    "Door01Icon",
    "Tree01Icon",
    "Car01Icon",
    "OfficeIcon",
    "Building01Icon",
    "Wifi01Icon",
    "Tv01Icon",
    "GameController01Icon",
    "Book01Icon",
    "Dumbbell01Icon",
    "WashingMachineIcon",
    "Store01Icon",
    "Sun01Icon",
    "Baby01Icon",
]

DEFAULT_SPACE_ICON: SpaceIconKey = "Home01Icon"


class SpaceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    icon: str
    created_at: datetime


class SpaceCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    icon: SpaceIconKey = Field(default=DEFAULT_SPACE_ICON)


class SpaceUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    icon: SpaceIconKey | None = None
