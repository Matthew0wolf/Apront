{ pkgs }: {
  deps = [
    pkgs.python3
    pkgs.python3Packages.pip
    pkgs.nodejs-18_x
    pkgs.nodePackages.npm
    pkgs.postgresql
  ];
}

