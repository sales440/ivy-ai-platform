from abc import ABC, abstractmethod
import logging

class BaseToolInstaller(ABC):
    def __init__(self, config):
        self.config = config
        self.logger = logging.getLogger(__name__)

    @abstractmethod
    def install(self, tool_name: str, tool_config: dict):
        """Installs the specific tool."""
        pass

    @abstractmethod
    def validate(self, tool_name: str) -> bool:
        """Validates that the tool is installed and healthy."""
        pass

    def run(self, tool_name: str, tool_config: dict):
        self.logger.info(f"Starting installation for {tool_name}...")
        try:
            self.install(tool_name, tool_config)
            if self.validate(tool_name):
                self.logger.info(f"Successfully installed and validated {tool_name}.")
            else:
                self.logger.error(f"Validation failed for {tool_name}.")
        except Exception as e:
            self.logger.exception(f"Failed to install {tool_name}: {e}")
            raise
