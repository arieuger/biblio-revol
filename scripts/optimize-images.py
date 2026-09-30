import os
from PIL import Image

def optimize_images(directory, quality=80, max_width=1920):
    supported_formats = ('.jpg', '.jpeg', '.png')
    
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.lower().endswith(supported_formats):
                file_path = os.path.join(root, file)
                try:
                    with Image.open(file_path) as img:
                        # Skip small images
                        if os.path.getsize(file_path) < 100 * 1024: # 100KB
                            continue
                            
                        original_size = os.path.getsize(file_path)
                        
                        # Resize if too large
                        if img.width > max_width:
                            ratio = max_width / float(img.width)
                            new_height = int(float(img.height) * float(ratio))
                            img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
                        
                        # Save with optimization
                        if file.lower().endswith(('.jpg', '.jpeg')):
                            img.save(file_path, "JPEG", optimize=True, quality=quality)
                        elif file.lower().endswith('.png'):
                            # Convert to RGB if saving as JPEG to save space, 
                            # but here we keep PNG and just optimize
                            img.save(file_path, "PNG", optimize=True)
                            
                        new_size = os.path.getsize(file_path)
                        if new_size < original_size:
                            print(f"Optimized {file}: {original_size/1024:.1f}KB -> {new_size/1024:.1f}KB")
                        else:
                            # If optimization didn't help, we could revert, but usually it does
                            pass
                except Exception as e:
                    print(f"Error processing {file}: {e}")

if __name__ == "__main__":
    images_dir = os.path.join(os.path.dirname(__file__), '../public/images')
    print(f"Starting image optimization in {images_dir}...")
    optimize_images(images_dir)
    print("Optimization complete.")
