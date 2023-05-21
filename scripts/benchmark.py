import time
import os
import json
from transformers import GPT2Tokenizer, GPT2LMHeadModel
import torch

# Set up GPU for training
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Load pre-trained model tokenizer (vocabulary)
tokenizer = GPT2Tokenizer.from_pretrained("gpt2")

# Load pre-trained model (weights)
model = GPT2LMHeadModel.from_pretrained("gpt2")
model = model.to(device)

# Folder with JSONL files
folder = "./stores/corpus"

# Time for benchmarking
start_time = time.time()

# Number of sequences processed
num_sequences = 0

# Process each file in the folder
for filename in os.listdir(folder):
    if filename.endswith(".jsonl"):
        with open(os.path.join(folder, filename), "r") as file:
            for line in file:
                data = json.loads(line)
                prompt = data.get("prompt", "")
                response = data.get("response", "")
                
                # Combine prompt and response into one sequence
                sequence = prompt + tokenizer.eos_token + response

                # Tokenize sequence and prepare input tensors
                inputs = tokenizer(sequence, return_tensors="pt")
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
