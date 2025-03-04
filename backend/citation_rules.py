"""
Citation rules based on Purdue OWL guidelines for APA 7th Edition and MLA 9th Edition.
"""

APA_RULES = {
    'website': {
        'format': '{author}{date}{title}{publisher}{url}',
        'rules': {
            'author': {
                'format': '{0}. ' if '{0}' else '',
                'rules': [
                    'Use last name, followed by initials',
                    'For multiple authors, use & before the last author',
                    'For 3+ authors, list first author followed by et al.',
                ]
            },
            'date': {
                'format': '({0}). ' if '{0}' else '(n.d.). ',
                'rules': [
                    'Use year of publication',
                    'Use (n.d.) if no date is available',
                    'For periodically updated sources, include retrieval date',
                ]
            },
            'title': {
                'format': '{0}',
                'rules': [
                    'Capitalize only the first word of title and subtitle',
                    'Do not italicize or use quotation marks',
                    'End with a period',
                ]
            },
            'publisher': {
                'format': '. {0}' if '{0}' else '',
                'rules': [
                    'Include site name if different from author',
                    'Omit publisher if same as author',
                    'End with a period',
                ]
            },
            'url': {
                'format': '. {0}',
                'rules': [
                    'Include complete URL or DOI',
                    'Do not end with a period',
                    'Remove "https://" if URL is too long',
                ]
            }
        }
    }
}

MLA_RULES = {
    'website': {
        'format': '{author}{title}{container}{publisher}{date}{location}',
        'rules': {
            'author': {
                'format': '{0}. ' if '{0}' else '',
                'rules': [
                    'Start with author\'s last name, followed by first name',
                    'For multiple authors, use and before the last author',
                    'If no author, start with title',
                ]
            },
            'title': {
                'format': '"{0}." ' if '{0}' else '',
                'rules': [
                    'Use quotation marks around article/page titles',
                    'Italicize website names',
                    'Capitalize all major words',
                ]
            },
            'container': {
                'format': '{0}, ' if '{0}' else '',
                'rules': [
                    'Include website name in italics',
                    'End with a comma',
                ]
            },
            'publisher': {
                'format': '{0}, ' if '{0}' else '',
                'rules': [
                    'Include organization responsible for the site',
                    'Omit if same as website name',
                    'End with a comma',
                ]
            },
            'date': {
                'format': '{0}, ' if '{0}' else '',
                'rules': [
                    'Use day month year format',
                    'Abbreviate months',
                    'End with a comma',
                ]
            },
            'location': {
                'format': '{0}',
                'rules': [
                    'Include full URL without "https://"',
                    'End with a period',
                ]
            }
        }
    }
}

def get_citation_rules(style, source_type):
    """Get citation rules for a specific style and source type."""
    if style.upper() == 'APA':
        return APA_RULES.get(source_type, {})
    elif style.upper() == 'MLA':
        return MLA_RULES.get(source_type, {})
    return {}

def validate_citation(citation_data, style, source_type):
    """Validate citation data against rules."""
    rules = get_citation_rules(style, source_type)
    if not rules:
        return {'valid': False, 'errors': ['Unsupported citation style or source type']}
    
    errors = []
    for field, field_rules in rules['rules'].items():
        value = citation_data.get(field)
        if not value and field_rules.get('required', False):
            errors.append(f'Missing required field: {field}')
            
    return {
        'valid': len(errors) == 0,
        'errors': errors
    }

def format_citation(citation_data, style, source_type):
    """Format citation according to style rules."""
    rules = get_citation_rules(style, source_type)
    if not rules:
        return None
        
    formatted_parts = {}
    for field, field_rules in rules['rules'].items():
        value = citation_data.get(field, '')
        if value:
            formatted_parts[field] = field_rules['format'].format(value)
        else:
            formatted_parts[field] = ''
            
    return rules['format'].format(**formatted_parts).strip()
