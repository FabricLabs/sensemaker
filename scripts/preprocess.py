import os
from utils import preprocess_corpus

def main():
    raw_data_dir = "data/raw/stores/corpus"
    processed_data_dir = "data/processed"
    
    preprocess_corpus(raw_data_dir, processed_data_dir)

if __name__ == "__main__":
    main()
