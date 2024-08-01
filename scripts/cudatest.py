import torch

# Check if CUDA is available
if torch.cuda.is_available():
    # Get the number of CUDA devices
    device_count = torch.cuda.device_count()

    # Loop over each device and print its major and minor CUDA capability
    for i in range(device_count):
        props = torch.cuda.get_device_properties(i)
        print(f"Device {i}: CUDA Capability: {props.major}.{props.minor}")
else:
    print("No CUDA devices available")
