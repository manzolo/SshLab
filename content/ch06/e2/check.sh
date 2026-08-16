if lab_login_riuscito manzolo "-o StrictHostKeyChecking=yes"; then rc=0; else rc=$?; fi
lab_check secondo-incontro "$rc" "${rc:+rifiutato}" "login StrictHostKeyChecking=yes e BatchMode=yes"
lab_done
