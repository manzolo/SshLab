# Catena di build dell'immagine. Non serve per leggere i capitoli: serve per
# avere il terminale. Chi clona il repo vede il sito subito e compila solo se vuole.

.PHONY: all image state clean check-tools

all: image state          ## costruisce rootfs + snapshot (tutto quello che serve al browser)

image:                    ## rootfs 9p da Alpine x86  (~2 min)
	./build-rootfs.sh

state: ../images/fs.json  ## snapshot di boot istantaneo  (~1,5 min)
	node build-state.mjs

check-tools:
	@command -v docker >/dev/null || { echo "serve docker"; exit 1; }
	@command -v zstd   >/dev/null || { echo "serve zstd"; exit 1; }
	@python3 -c "import zstandard" 2>/dev/null || { echo "serve: pip install zstandard"; exit 1; }
	@echo "strumenti a posto"

clean:
	rm -rf ../images
