import torch

print("检查 PyTorch GPU 状态...")
print(f"PyTorch 版本: {torch.__version__}")
print(f"CUDA 是否可用: {torch.cuda.is_available()}")
if torch.cuda.is_available():
    print(f"GPU 名称: {torch.cuda.get_device_name(0)}")
    print(f"CUDA 版本: {torch.version.cuda}")
    print(f"cuDNN 版本: {torch.backends.cudnn.version()}")

try:
    from mamba_ssm import Mamba

    print("\nMamba 模块导入成功。")
except ImportError:
    print("\nMamba 模块未安装或导入失败，请检查 mamba_ssm 是否正确安装。")
    exit()

try:
    print("\n正在测试 Mamba 在 GPU 上运行...")
    model = Mamba(d_model=64, d_state=16, d_conv=4, expand=2)
    model = model.cuda() if torch.cuda.is_available() else model
    x = torch.randn(1, 16, 64).cuda() if torch.cuda.is_available() else torch.randn(1, 16, 64)
    y = model(x)
    print(f"运行成功，输出张量形状: {y.shape}")
except Exception as e:
    print(f"\nMamba GPU 运行失败: {e}")