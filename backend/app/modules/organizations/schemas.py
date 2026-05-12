from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

OrganizationRole = Literal["OWNER", "ADMIN", "ANALYST", "VIEWER"]


class OrganizationCreate(BaseModel):
    name: str = Field(min_length=2, max_length=255)


class OrganizationUpdate(BaseModel):
    name: str = Field(min_length=2, max_length=255)


class OrganizationMemberCreate(BaseModel):
    email: str = Field(min_length=5, max_length=255)
    role: OrganizationRole = "VIEWER"


class OrganizationMemberUpdate(BaseModel):
    role: OrganizationRole


class OrganizationPublic(BaseModel):
    id: str
    name: str
    slug: str
    created_at: datetime

    model_config = {"from_attributes": True}


class OrganizationMemberPublic(BaseModel):
    id: str
    organization_id: str
    user_id: str
    role: OrganizationRole
    user_email: str
    user_full_name: str
    created_at: datetime
