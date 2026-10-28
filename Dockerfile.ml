# ── ML service: Module 3 (MRIParamNet) + Module 4 (CHARMS-Lite) ───────
# Dùng PyTorch bản CPU: ~200 MB thay vì ~2 GB bản CUDA. VPS không có GPU nên
# bản CUDA chỉ tốn dung lượng và thời gian build.
FROM python:3.11-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    OMP_NUM_THREADS=2

# libgomp1 cần cho PyTorch; libgl1/libglib2.0 cho Pillow/matplotlib.
RUN apt-get update \
 && apt-get install -y --no-install-recommends libgomp1 libgl1 libglib2.0-0 \
 && rm -rf /var/lib/apt/lists/*

COPY ml_service/requirements.txt ./ml_service/requirements.txt
RUN pip install --no-cache-dir \
      --extra-index-url https://download.pytorch.org/whl/cpu \
      torch torchvision \
 && pip install --no-cache-dir -r ml_service/requirements.txt

COPY ml_service ./ml_service
COPY module3_deploy ./module3_deploy
COPY module4_deploy ./module4_deploy

EXPOSE 8788

# Model load lúc khởi động (lifespan) — giữ container chạy để không phải load lại.
CMD ["python", "ml_service/server.py"]
