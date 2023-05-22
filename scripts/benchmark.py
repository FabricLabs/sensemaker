import time
import os
import torch
import json
from transformers import GPT2Tokenizer, GPT2LMHeadModel
from multiprocessing import Pool

# Load pre-trained model tokenizer (vocabulary)
tokenizer = GPT2Tokenizer.from_pretrained("gpt2")

# Set the pad_token explicitly
tokenizer.pad_token = tokenizer.eos_token

# Load pre-trained model (weights)
model = GPT2LMHeadModel.from_pretrained("gpt2")

# Number of processes (equal to the number of available GPUs)
num_processes = torch.cuda.device_count()

# Target directory
directory = "./stores/corpus"


def process_file(file_path):
    with open(file_path, "rb") as file:
        content = file.read()

        # Convert raw content to hexadecimal bytes
        hex_content = content.hex()

        # Create metadata dictionary with file name and other details
        metadata = {"file_name": os.path.basename(file_path)}

        # Embed metadata in the content string
        content_with_metadata = json.dumps(metadata) + hex_content

        # Tokenize the content with metadata
        inputs = tokenizer(content_with_metadata, return_tensors="pt", truncation=True, padding=True)

        # Perform a forward pass (evaluate the model on this input)
        outputs = model(**inputs)


if __name__ == "__main__":
    # Time for benchmarking
    start_time = time.time()

    # Create a pool of processes
    pool = Pool(processes=num_processes)

    # Process each file in the directory in parallel
    file_paths = [os.path.join(directory, filename) for filename in os.listdir(directory) if os.path.isfile(os.path.join(directory, filename))]
    pool.map(process_file, file_paths)

    # Close the pool
    pool.close()
    pool.join()

    # Calculate sequences per second
    end_time = time.time()
    sequences_per_second = len(file_paths) / (end_time - start_time)

    print(f"Sequences per second: {sequences_per_second}")
