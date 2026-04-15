from __future__ import annotations

from types import SimpleNamespace

import pytest

from app.core.exceptions import AppException
from app.services import detection


class FakeResponse:
    def __init__(self, content):
        self.choices = [SimpleNamespace(message=SimpleNamespace(content=content))]


class FakeCompletions:
    def __init__(self, responses):
        self._responses = responses
        self.calls = []

    def create(self, **kwargs):
        self.calls.append(kwargs)
        index = len(self.calls) - 1
        return FakeResponse(self._responses[index])


class FakeClient:
    def __init__(self, responses):
        self.chat = SimpleNamespace(completions=FakeCompletions(responses))


def test_detection_retries_when_first_pass_is_empty(monkeypatch):
    client = FakeClient(
        [
            "[]",
            """[
                {
                    "label": "Cupcake",
                    "confidence": 0.93,
                    "estimated_grams": 110,
                    "unit": "piece",
                    "count": 1,
                    "piece_avg_weight": 110,
                    "cal": 385,
                    "protein": 4,
                    "fat": 16,
                    "carbohydrates": 55
                }
            ]""",
        ]
    )

    monkeypatch.setattr(detection, "get_openai_client", lambda: client)
    monkeypatch.setattr(
        detection,
        "get_settings",
        lambda: SimpleNamespace(openai_detection_model="gpt-4.1-nano"),
    )

    result = detection.analyze_food_image(b"fake-image", "image/jpeg")

    assert result == [
        {
            "label": "Cupcake",
            "confidence": 0.93,
            "estimated_grams": 110.0,
            "unit": "piece",
            "count": 1,
            "piece_avg_weight": 110.0,
            "cal": 385.0,
            "protein": 4.0,
            "fat": 16.0,
            "carbohydrates": 55.0,
        }
    ]
    assert len(client.chat.completions.calls) == 2
    assert client.chat.completions.calls[0]["model"] == "gpt-4.1-nano"
    assert (
        client.chat.completions.calls[0]["messages"][0]["content"][1]["image_url"]["detail"]
        == "high"
    )


def test_detection_retries_after_parse_failure(monkeypatch):
    client = FakeClient(
        [
            "not json",
            """[
                {
                    "label": "Apple",
                    "confidence": 0.88,
                    "estimated_grams": 182,
                    "unit": "piece",
                    "count": 1,
                    "piece_avg_weight": 182,
                    "cal": 52,
                    "protein": 0.3,
                    "fat": 0.2,
                    "carbohydrates": 14
                }
            ]""",
        ]
    )

    monkeypatch.setattr(detection, "get_openai_client", lambda: client)
    monkeypatch.setattr(
        detection,
        "get_settings",
        lambda: SimpleNamespace(openai_detection_model="gpt-4.1-nano"),
    )

    result = detection.analyze_food_image(b"fake-image", "image/jpeg")

    assert len(result) == 1
    assert result[0]["label"] == "Apple"
    assert len(client.chat.completions.calls) == 2


def test_detection_raises_when_all_attempts_fail(monkeypatch):
    client = FakeClient(["not json", "{bad}"])

    monkeypatch.setattr(detection, "get_openai_client", lambda: client)
    monkeypatch.setattr(
        detection,
        "get_settings",
        lambda: SimpleNamespace(openai_detection_model="gpt-4.1-nano"),
    )

    with pytest.raises(AppException) as exc_info:
        detection.analyze_food_image(b"fake-image", "image/jpeg")

    assert exc_info.value.code == "ai_parse_failed"
    assert len(client.chat.completions.calls) == 2
