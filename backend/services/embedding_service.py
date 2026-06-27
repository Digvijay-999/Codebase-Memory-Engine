from sentence_transformers import SentenceTransformer

# Load the model once when the app starts
model = SentenceTransformer("all-MiniLM-L6-v2")


def create_embedding(text: str):
    """
    Convert text into a vector embedding.
    """
    embedding = model.encode(text)
    return embedding.tolist()
