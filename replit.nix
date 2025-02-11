{pkgs}: {
  deps = [
    pkgs.postgresql
    pkgs.dig
    pkgs.unixtools.ping
  ];
}
