from datetime import datetime

from pydantic import BaseModel, Field


class OrganizationCreate(BaseModel):
    name: str = Field(min_length=2, max_length=255)


class OrganizationUpdate(BaseModel):
    name: str = Field(min_length=2, max_length=255)


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
    role: str
    user_email: str
    user_full_name: str
    created_at: datetime
