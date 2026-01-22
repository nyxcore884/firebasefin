{ pkgs, ... }: {
  channel = "stable-23.11";
  
  packages = [
    pkgs.nodejs_20
    pkgs.python311
    pkgs.python311Packages.pip
    pkgs.python311Packages.flask
    pkgs.python311Packages.pandas
    pkgs.docker
  ];

  idx = {
    extensions = [
      "csstools.postcss"
    ];
    
    workspace = {
      onCreate = {
        npm-install = "cd frontend && npm install";
      };
    };
    
    previews = {
      enable = true;
      previews = {
        web = {
          command = ["npm" "run" "dev" "--prefix" "frontend" "--" "--port" "$PORT" "--host" "0.0.0.0"];
          manager = "web";
        };
      };
    };
  };
}
