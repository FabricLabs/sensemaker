import time
import os
import torch
import json
from transformers import GPT2Tokenizer, GPT2LMHeadModel

# Set up GPU for training
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Load pre-trained model tokenizer (vocabulary)
tokenizer = GPT2Tokenizer.from_pretrained("gpt2")

# Set the pad_token explicitly
tokenizer.pad_token = tokenizer.eos_token

# Load pre-trained model (weights)
model = GPT2LMHeadModel.from_pretrained("gpt2")
model = model.to(device)

# Time for benchmarking
start_time = time.time()

# Number of sequences processed
num_sequences = 0

# Target directory
directory = "./stores/corpus"

# Process each file in the directory
for filename in os.listdir(directory):
    file_path = os.path.join(directory, filename)
    if os.path.isfile(file_path):
        with open(file_path, "rb") as file:
            content = file.read()

            # Convert raw content to hexadecimal bytes
            hex_content = content.hex()

            # Create metadata dictionary with file name and other details
            metadata = {"file_name": filename}

            # Embed metadata in the content string
            content_with_metadata = json.dumps(metadata) + hex_content

            # Tokenize the content with metadata
            inputs = tokenizer(content_with_metadata, return_tensors="pt", truncation=True, padding=True)
            inputs = {k: v.to(device) for k, v in inputs.items()}

            # Perform a forward pass (evaluate the model on this input)
            outputs = model(**inputs)

            # Don't perform a backward pass (we're not actually training)
            # Increment sequence count
            num_sequences += 1

# Calculate sequences per second
end_time = time.time()
sequences_per_second = num_sequences / (end_time - start_time)

print(f"Sequences per second: {sequences_per_second}")
