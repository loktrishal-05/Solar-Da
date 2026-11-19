"""Convert a '# %%' script into a Jupyter notebook: python to_ipynb.py train_colab.py"""
import json
import sys

src = open(sys.argv[1], encoding="utf-8").read().split("# %%")
cells = []
for chunk in src:
    if not chunk.strip():
        continue
    md = chunk.startswith(" [markdown]")
    body = chunk.split("\n", 1)[1] if "\n" in chunk else ""
    lines = [ln[2:] if md and ln.startswith("# ") else ln for ln in body.strip("\n").split("\n")]
    text = [ln + "\n" for ln in lines]
    text[-1] = text[-1].rstrip("\n")
    cells.append({"cell_type": "markdown", "metadata": {}, "source": text} if md else
                 {"cell_type": "code", "metadata": {}, "execution_count": None, "outputs": [], "source": text})
nb = {"cells": cells, "metadata": {"accelerator": "GPU", "colab": {"provenance": []},
      "kernelspec": {"name": "python3", "display_name": "Python 3"}}, "nbformat": 4, "nbformat_minor": 0}
json.dump(nb, open(sys.argv[1].replace(".py", ".ipynb"), "w", encoding="utf-8"), indent=1)
