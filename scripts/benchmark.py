import torch
from transformers import GPT2Tokenizer, GPT2LMHeadModel, AdamW
from torch.utils.data import Dataset, DataLoader

# Check if PyTorch sees your GPUs
print(torch.cuda.device_count())

class GPT2Dataset(Dataset):
    # Simple Dataset class for GPT-2
    def __init__(self, txt_list, tokenizer, max_length):
        self.tokenizer = tokenizer
        self.input_ids = []
        self.attn_masks = []
        for txt in txt_list:
            encodings_dict = tokenizer(txt, truncation=True, max_length=max_length, padding="max_length")
            self.input_ids.append(torch.tensor(encodings_dict['input_ids']))
            self.attn_masks.append(torch.tensor(encodings_dict['attention_mask']))
    
    def __len__(self):
        return len(self.input_ids)

    def __getitem__(self, idx):
        return self.input_ids[idx], self.attn_masks[idx]

def train_on_gpu(device_id):
    # Select GPU
    device = torch.device(f"cuda:{device_id}" if torch.cuda.is_available() else "cpu")
    print(f"Training on: {device}")
    
    # Load tokenizer and model
    tokenizer = GPT2Tokenizer.from_pretrained('gpt2')
    model = GPT2LMHeadModel.from_pretrained('gpt2')
    model.to(device)
    
    # Initialize dataset
    text_data = ["Some text to train on", "Some other text"]
    max_length = 128
    dataset = GPT2Dataset(text_data, tokenizer, max_length)
    loader = DataLoader(dataset, batch_size=1, shuffle=True)
    
    optimizer = AdamW(model.parameters(), lr=1e-4)
    
    model.train()
    for epoch in range(2):
        print(f"Epoch: {epoch}")
        for idx, batch in enumerate(loader):
            input_ids, attention_mask = [b.to(device) for b in batch]
            outputs = model(input_ids, attention_mask=attention_mask, labels=input_ids)
            loss = outputs.loss
            loss.backward()
            optimizer.step()
            optimizer.zero_grad()

            if idx % 10 == 0:
                print(f"Loss: {loss.item()}")

def main():
    mode = input("Select mode ([1] single, [2] parallel): ")
    
    if mode == '1':
        gpu_id = input("Select GPU ID: ")
        train_on_gpu(gpu_id)
    elif mode == '2':
        for gpu_id in range(torch.cuda.device_count()):
            train_on_gpu(gpu_id)
    else:
        print("Invalid mode. Please enter either '1' for single or '2' for parallel.")
        
if __name__ == '__main__':
    main()
