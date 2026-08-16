attesa=$(lab_fp /home/manzolo/.ssh/id_ed25519.pub)
lab_fact impronta_della_chiave "${attesa:-(chiave assente)}"
lab_answer_eq impronta-giusta "$attesa"
lab_done
