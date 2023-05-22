import time
import os
import torch

# Set up GPU for training
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

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

            # Assuming content is in hexadecimal bytes representation,
            # decode it to bytes
            try:
                byte_content = bytes.fromhex(content.decode())
            except ValueError:
                print(f"Skipping file: {file_path}. Not in hexadecimal format.")
                continue

            # Process the content as needed
            # Here, we can assume each byte as a sequence

            # Example: Count the number of sequences
            num_sequences += len(byte_content)

# Calculate sequences per second
end_time = time.time()
sequences_per_second = num_sequences / (end_time - start_time)

print(f"Sequences per second: {sequences_per_second}")
