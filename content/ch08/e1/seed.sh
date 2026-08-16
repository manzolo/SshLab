rm -rf /home/manzolo/.ssh /home/deploy/.ssh
chmod 755 /home/deploy
chmod g-s /home/deploy
install -d -m 700 -o manzolo -g manzolo /home/manzolo/.ssh
set -- 01 02 03 04 05 06 07 08 09 10 11 12 13 14 15 16
scelta=$(edu_rand_pick 800 "$@")
install -m 600 -o manzolo -g manzolo "/opt/lab/keys/ed25519/$scelta" /home/manzolo/.ssh/id_ed25519
install -m 644 -o manzolo -g manzolo "/opt/lab/keys/ed25519/$scelta.pub" /home/manzolo/.ssh/id_ed25519.pub
{
    printf '%s ' "$(lab_srv_ip)"
    cat /etc/ssh/ssh_host_ed25519_key.pub
} > /home/manzolo/.ssh/known_hosts
chown manzolo:manzolo /home/manzolo/.ssh/known_hosts
chmod 600 /home/manzolo/.ssh/known_hosts
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
chmod g-s /home/deploy/.ssh
install -m 600 -o deploy -g deploy "/opt/lab/keys/ed25519/$scelta.pub" /home/deploy/.ssh/authorized_keys
guasto=$(edu_rand_pick 801 cartella autorizzate home privata)
case "$guasto" in
    cartella) chmod 777 /home/deploy/.ssh ;;
    autorizzate) chmod 666 /home/deploy/.ssh/authorized_keys ;;
    home) chmod 777 /home/deploy ;;
    privata) chmod 644 /home/manzolo/.ssh/id_ed25519 ;;
esac
printf '%s' "$guasto" > "$LAB_STATE/guasto"
lab_log_azzera
mkdir -p "$LAB"
