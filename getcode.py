import os

# 🔧 CONFIG
base_dir = "src/client"  # root directory
selected_folders = ['config', 'entities', 'scenes']  # folders to include
output_file = "out.txt"


def get_all_files(folder_path):
    file_paths = []
    for root, dirs, files in os.walk(folder_path):
        for file in files:
            full_path = os.path.join(root, file)
            file_paths.append(full_path)
    return file_paths


output = []

for folder in selected_folders:
    folder_path = os.path.join(base_dir, folder)

    if not os.path.exists(folder_path):
        print(f"Skipping missing folder: {folder}")
        continue

    files = get_all_files(folder_path)

    for file_path in files:
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()

            relative_path = os.path.relpath(file_path, base_dir)

            output.append(f"{relative_path}:\n{content}\n")

        except Exception as e:
            print(f"Error reading {file_path}: {e}")


# 📝 Write to output file
with open(output_file, "w", encoding="utf-8") as f:
    f.write("\n".join(output))

print(f"Done! Output written to {output_file}")