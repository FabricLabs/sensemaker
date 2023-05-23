import os
import argparse
import torch
from transformers import BertTokenizer, BertForSequenceClassification
from torch.utils.data import Dataset, DataLoader
from multiprocessing import Process

# Custom dataset for training
class TextDataset(Dataset):
    def __init__(self, corpus):
        self.corpus = corpus
    def __len__(self):
        return len(self.corpus)
    def __getitem__(self, idx):
        return self.corpus[idx]

# Task function to be run on each GPU
def gpu_task(gpu_id, corpus, duration):
    device = torch.device(f'cuda:{gpu_id}')
    model = BertForSequenceClassification.from_pretrained('bert-base-uncased').to(device)
    tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')
    data = TextDataset(corpus)
    data_loader = DataLoader(data, batch_size=16)

    # Tokenize and train
    start = torch.cuda.Event(enable_timing=True)
    end = torch.cuda.Event(enable_timing=True)

    start.record()
    for i, text in enumerate(data_loader):
        inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True).to(device)
        outputs = model(**inputs)
        loss = outputs.loss
        loss.backward()

        # Check if duration is exceeded
        if start.elapsed_time(end)/1000 >= duration:
            break

    print(f'GPU {gpu_id} finished')

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--duration', type=int, default=60, help='benchmark duration in seconds')
    args = parser.parse_args()

    # Load corpus
    corpus = []
    for file in os.listdir('stores/corpus'):
        with open(os.path.join('stores/corpus', file), 'r') as f:
            corpus.extend(f.readlines())

    # Get number of GPUs
    n_gpus = torch.cuda.device_count()

    # Create a process for each GPU
    processes = []
    for gpu_id in range(n_gpus):
        p = Process(target=gpu_task, args=(gpu_id, corpus, args.duration))
        p.start()
        processes.append(p)

    # Wait for all processes to finish
    for p in processes:
        p.join()

if __name__ == '__main__':
    main()
