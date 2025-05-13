{
  description = "Android SDK + Java dev‑shell";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.05";   # pin the channel
  # (add other inputs such as 'fenix' or 'home-manager' here when you need them)

  outputs = { self, nixpkgs }:
    let
      # Pick the host platforms you care about
      systems = [ "aarch64-darwin" "x86_64-linux" ];

      mkFor = system: let
        pkgs = import nixpkgs {
          inherit system;
          config = {
            # Android SDK is un‑free and needs its licence accepted
            allowUnfree = true;
            android_sdk.accept_license = true;
          };
        };

        # You can use the one‑shot `android-sdk` attr *or* compose a bespoke SDK:
        android = pkgs.androidenv.composeAndroidPackages {
          # ------ tweak to match your project -----------------------------
          platformVersions   = [ "VanillaIceCream" ]; # API 35 (Android 15)
          buildToolsVersions = [ "34.0.0" ];       # Use available stable version
          includeEmulator    = true;
          includeNDK         = true;
          includeSystemImages = true;
          abiVersions        = [ "arm64-v8a" ];
        };
      in {
        packages = { android-sdk = android.androidsdk; };

        devShells = {
          default = pkgs.mkShell {
            name = "android‑dev";
            buildInputs = [
              android.androidsdk
              pkgs.jdk17
              pkgs.gradle
            ];

            # The hook inside the SDK already exports these, but setting them
            # explicitly makes them visible from Direnv, CI, etc.
            shellHook = ''
              export ANDROID_HOME=${android.androidsdk}/libexec/android-sdk
              export ANDROID_SDK_ROOT=$ANDROID_HOME
              echo "Android SDK →  $ANDROID_HOME"
            '';
          }; # End of mkShell
        }; # End of devShells attribute set
      }; # End of the `in { ... }` block returned by mkFor
    # The `let` block for `mkFor` ends here. The next part is the `in` for the main `outputs` `let`.
    in {
      packages = nixpkgs.lib.genAttrs systems (system:
        (mkFor system).packages
      );
      devShells = nixpkgs.lib.genAttrs systems (system:
        (mkFor system).devShells
      );
    };
}
