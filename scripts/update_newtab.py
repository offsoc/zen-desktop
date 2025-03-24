import os
import subprocess
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

NEW_TAB_DIR = "./engine/browser/components/newtab"
ENGINE_DIR = "./engine"
NPM_INSTALL_COMMANDS = ["npm install", "npm install meow@9.0.0"]
BUNDLE_COMMAND = "npm run bundle --prefix=browser/components/newtab"


def install_dependencies():
  if not os.path.isdir(NEW_TAB_DIR):
    logging.error(f"Directory not found: {NEW_TAB_DIR}")
    raise FileNotFoundError(f"New tab directory {NEW_TAB_DIR} does not exist")

  for command in NPM_INSTALL_COMMANDS:
    try:
      logging.info(f"Running command: {command} in {NEW_TAB_DIR}")
      subprocess.run(
          command.split(),
          cwd=NEW_TAB_DIR,
          check=True,
          capture_output=True,
          text=True
      )
      logging.info(f"Successfully executed: {command}")
    except subprocess.CalledProcessError as e:
      logging.error(f"Command failed: {command} - {e.stderr}")
      raise


def bundle_newtab_components():
  if not os.path.isdir(ENGINE_DIR):
    logging.error(f"Directory not found: {ENGINE_DIR}")
    raise FileNotFoundError(f"Engine directory {ENGINE_DIR} does not exist")

  try:
    logging.info(f"Bundling newtab components in {ENGINE_DIR}")
    result = subprocess.run(
        BUNDLE_COMMAND.split(),
        cwd=ENGINE_DIR,
        check=True,
        capture_output=True,
        text=True
    )
    logging.info(f"Bundle completed successfully: {result.stdout}")
  except subprocess.CalledProcessError as e:
    logging.error(f"Bundle failed: {e.stderr}")
    raise


def update_newtab(init: bool = True):
  try:
    if init:
      logging.info("Starting dependency installation")
      install_dependencies()
      logging.info("Dependencies installed successfully")

    logging.info("Starting bundle process")
    bundle_newtab_components()
    logging.info("Newtab update completed successfully")

  except (subprocess.CalledProcessError, FileNotFoundError) as e:
    logging.error(f"Update process failed: {str(e)}")
    raise
  except Exception as e:
    logging.error(f"Unexpected error: {str(e)}")
    raise


if __name__ == "__main__":
  update_newtab(init=False)
