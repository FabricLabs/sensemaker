import torch

def main():
    # Get the number of available GPUs
    num_gpus = torch.cuda.device_count()

    # Print GPU information header
    print("GPU Information:")
    print("--------------------------------------------------")
    print("GPU ID\t\tName\t\t\tMemory (GB)\tCompute Capability")
    print("--------------------------------------------------")

    for gpu_id in range(num_gpus):
        gpu_info = torch.cuda.get_device_properties(gpu_id)
        gpu_name = gpu_info.name
        gpu_memory = round(gpu_info.total_memory / (1024 ** 3), 2)
        gpu_compute_capability = '.'.join(str(x) for x in gpu_info.major_minor)

        print(f"{gpu_id}\t\t{gpu_name}\t\t{gpu_memory}\t\t{gpu_compute_capability}")

    print("\n")

    # GPU capabilities summary
    print("GPU Capabilities Summary:")
    print("--------------------------------------------------")
    print("Capability\t\tEstimate")
    print("--------------------------------------------------")

    for gpu_id in range(num_gpus):
        gpu_info = torch.cuda.get_device_properties(gpu_id)
        gpu_name = gpu_info.name

        # Estimate Jack The Ripper password cracking capability
        password_cracking_capability = "High" if "GeForce" in gpu_name else "Low"

        # Estimate Bitcoin vanity address generation capability
        bitcoin_vanity_generation_capability = "High" if gpu_info.major >= 7 else "Low"

        # Estimate TOR network vanity address generation capability
        tor_vanity_generation_capability = "High" if gpu_info.major >= 6 else "Low"

        # Estimate Machine Learning potential
        machine_learning_potential = "High" if gpu_info.total_memory > 8000 else "Low"

        print(f"{gpu_id}\t\tPassword Cracking:\t{password_cracking_capability}")
        print(f"{gpu_id}\t\tBitcoin Vanity Generation:\t{bitcoin_vanity_generation_capability}")
        print(f"{gpu_id}\t\tTOR Vanity Generation:\t{tor_vanity_generation_capability}")
        print(f"{gpu_id}\t\tMachine Learning:\t{machine_learning_potential}")
        print("--------------------------------------------------")


if __name__ == "__main__":
    main()
