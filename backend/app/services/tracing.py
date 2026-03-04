import uuid
from loguru import logger

from app.core.config import settings

_tracer = None


def setup_tracing():
    global _tracer

    if not settings.OTEL_ENABLED:
        logger.info("OpenTelemetry disabled — using local trace IDs only")
        return

    try:
        from opentelemetry import trace
        from opentelemetry.sdk.trace import TracerProvider
        from opentelemetry.sdk.trace.export import BatchSpanProcessor
        from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
        from opentelemetry.sdk.resources import Resource
        from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

        resource = Resource.create({"service.name": settings.OTEL_SERVICE_NAME})
        provider = TracerProvider(resource=resource)

        exporter = OTLPSpanExporter(endpoint=settings.OTEL_EXPORTER_ENDPOINT)
        provider.add_span_processor(BatchSpanProcessor(exporter))

        trace.set_tracer_provider(provider)
        _tracer = trace.get_tracer(settings.OTEL_SERVICE_NAME)

        logger.info(
            f"OpenTelemetry initialized — exporting to {settings.OTEL_EXPORTER_ENDPOINT}"
        )
    except ImportError:
        logger.warning(
            "OpenTelemetry packages not installed — tracing disabled. "
            "Install with: pip install opentelemetry-api opentelemetry-sdk "
            "opentelemetry-exporter-otlp opentelemetry-instrumentation-fastapi"
        )
    except Exception as e:
        logger.error(f"Failed to initialize OpenTelemetry: {e}")


def instrument_app(app):
    """Instrument a FastAPI app with OpenTelemetry if enabled."""
    if not settings.OTEL_ENABLED:
        return

    try:
        from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
        FastAPIInstrumentor.instrument_app(app)
        logger.info("FastAPI instrumented with OpenTelemetry")
    except ImportError:
        pass
    except Exception as e:
        logger.error(f"Failed to instrument FastAPI: {e}")


def generate_trace_id() -> str:
    """Generate a trace ID. Uses OTel if available, otherwise a UUID."""
    if _tracer:
        from opentelemetry import trace
        span = trace.get_current_span()
        ctx = span.get_span_context()
        if ctx.trace_id:
            return format(ctx.trace_id, "032x")
    return uuid.uuid4().hex


def generate_span_id() -> str:
    """Generate a span ID. Uses OTel if available, otherwise a UUID prefix."""
    if _tracer:
        from opentelemetry import trace
        span = trace.get_current_span()
        ctx = span.get_span_context()
        if ctx.span_id:
            return format(ctx.span_id, "016x")
    return uuid.uuid4().hex[:16]
