import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from fastapi.testclient import TestClient
from app.models.database import Base, User, APIKey
from app.core.security import hash_password, generate_api_key, hash_for_storage
from app.main import app
from app.api.deps import get_db
import uuid

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False}
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="session")
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def db(setup_database):
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture(scope="function")
def client():
    return TestClient(app)


@pytest.fixture(scope="function")
def test_user(db: Session):
    user = User(
        id=str(uuid.uuid4()),
        email="test@example.com",
        username="testuser",
        hashed_password=hash_password("testpassword123"),
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture(scope="function")
def test_api_key(db: Session, test_user: User):
    api_key_string = generate_api_key()
    api_key = APIKey(
        id=str(uuid.uuid4()),
        user_id=test_user.id,
        key=hash_for_storage(api_key_string),
        name="test-key",
        is_active=True
    )
    db.add(api_key)
    db.commit()
    db.refresh(api_key)
    return api_key_string, api_key


@pytest.fixture(scope="function")
def client_with_auth(client: TestClient, test_api_key):
    api_key_string, _ = test_api_key
    client.headers = {"X-API-Key": api_key_string}
    return client
