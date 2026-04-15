# FoodSmart FastAPI Backend

Run the API from the `backend` directory:

```bash
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 5002 --reload
```

Environment variables are documented in [`.env.example`](./.env.example).

Detection uses `OPENAI_DETECTION_MODEL` and now defaults to `gpt-4.1-nano` to match the previous Flask `/analyze` behavior.
