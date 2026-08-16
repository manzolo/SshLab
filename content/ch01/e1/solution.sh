atteso=$(lab_srv ip -4 -o addr show veth-srv | awk '{print $4}' | cut -d/ -f1)
printf '%s' "$atteso" > "$LAB_STATE/answer"
