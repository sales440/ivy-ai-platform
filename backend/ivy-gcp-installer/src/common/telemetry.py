from opentelemetry import trace
from opentelemetry.exporter.cloud_trace import CloudTraceSpanExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import SimpleSpanProcessor
import logging

logger = logging.getLogger(__name__)

def setup_tracing(service_name: str):
    """Setup OpenTelemetry tracing with Google Cloud Trace exporter."""
    try:
        tracer_provider = TracerProvider()
        
        # In a real environment, we check if we are on GCP before adding the exporter
        # For now, we wrap in try/catch to avoid crashing local runs without credentials
        cloud_exporter = CloudTraceSpanExporter()
        span_processor = SimpleSpanProcessor(cloud_exporter)
        tracer_provider.add_span_processor(span_processor)
        
        trace.set_tracer_provider(tracer_provider)
        logger.info(f"OpenTelemetry tracing setup for {service_name}")
    except Exception as e:
        logger.warning(f"Could not setup Cloud Trace exporter: {e}")

def get_tracer(name: str):
    return trace.get_tracer(name)
