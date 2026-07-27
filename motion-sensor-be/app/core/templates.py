import os

from jinja2 import Environment, FileSystemLoader

TEMPLATES_DIR = os.path.join(os.path.dirname(__file__), "..", "templates")

env = Environment(loader=FileSystemLoader(TEMPLATES_DIR))


def render_template(template_name: str, **context) -> str:
    return env.get_template(template_name).render(**context)
