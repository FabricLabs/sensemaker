from gptindex_model import GPTIndexModel
from utils import load_data

def main():
    processed_data_dir = "data/processed"
    model_dir = "models/gptindex"

    data = load_data(processed_data_dir)

    model = GPTIndexModel()
    model.train(data)
    model.save(model_dir)

if __name__ == "__main__":
    main()
