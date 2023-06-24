from setuptools import setup, find_packages

with open('requirements.txt') as f:
    required = f.read().splitlines()

setup(
    name='jeeves',
    version='0.1',
    packages=find_packages(),
    url='https://github.com/lttinc/jeeves.dev',
    author='Legal Tools & Technology, Inc.',
    author_email='product@jeeves.dev',
    description='Jeeves AI',
    long_description=open('README.md').read(),
    long_description_content_type='text/markdown',
    install_requires=required,
    classifiers=[
        'Programming Language :: Python :: 3',
        'Programming Language :: Python :: 3.6',
        'Programming Language :: Python :: 3.7',
        'Programming Language :: Python :: 3.8',
        'Programming Language :: Python :: 3.9',
    ],
)
