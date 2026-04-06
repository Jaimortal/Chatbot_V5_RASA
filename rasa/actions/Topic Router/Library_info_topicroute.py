# Library topic patterns for detecting specific library-related questions
# Structure: each topic has phrases (exact match), strong_keywords (high weight), 
# weak_keywords (low weight), and required_context (must exist for match)
LIBRARY_TOPIC_PATTERNS = {
    "borrowing_rules": {
        "phrases": [
            "Library borrowing limit",
            "how many books can i borrow",
            "how many books i can borrow",
            "how many books may i borrow",
            "maximum books",
            "maximum books i can borrow",
            "many of the books i can borrow",
            "borrowing rules",
            "borrow from the library",
            "library borrowing rules",
            "pila ka libro pwede hulamon",
            "pwede ko makaborrow pila ka libro"
        ],
        "strong_keywords": ["borrow", "many", "limit", "pila", "pwede", "hulamon", "maximum"],
        "weak_keywords": ["books", "library", "libro", "many"],
        "required_context": []
    },
    "late_return_penalty": {
        "phrases": [
            "Library late penalty",
            "late return",
            "penalty",
            "fine",
            "overdue",
            "multa",
            "na late ug uli",
            "i uli og dugay",
            "i uli ang libro og dugay",
            "dugay na uli",
            "dugay nauli ang libro",
        ],
        "strong_keywords": ["late", "penalty", "fine", "overdue", "multa", "dugay", "uli"],
        "weak_keywords": ["return", "book", "libro"],
        "required_context": []
    },
    "library_hours": {
        "phrases": [
            "Library hours",
            "library hours",
            "what time does the library open",
            "what time library closed",
            "when is the library open",
            "open ang library",
            "unsa oras open ang library",
            "abri og sira ang library"
        ],
        "strong_keywords": ["hours", "time", "open", "closed", "abri", "sira", "oras"],
        "weak_keywords": ["library", "when"],
        "required_context": []
    },
    "library_id_card_location": {
        "phrases": [
            "Library ID location",
            "where to get library id",
            "where can i get library id",
            "asa makakuha ug library id",
            "library id location",
            "getting library id",
            "process of getting library id",
            "how to get library id",
            "unsaon pagkuha og library id",
            "process sa library id",
            "kuha og library id"
        ],
        "strong_keywords": ["where", "location", "asa", "process", "getting", "kuha", "unsaon"],
        "weak_keywords": ["library", "id", "card"],
        "required_context": ["library_id"]  # Must have library + id context
    },
    "library_id_card_requirements": {
        "phrases": [
            "Library ID requirements",
            "requirements for library id",
            "what do i need for library id",
            "unsa kailangan para sa library id",
            "requirements sa library id",
            "needed for library id",
            "kinahanglan para sa library id"
        ],
        "strong_keywords": [
            "requirements", "needed", "kailangan", "kinahanglan", "bring",
            "documents", "document", "needs", "cor"
        ],
        "weak_keywords": ["library", "id", "card", "for"],
        "required_context": ["library_id"]
    },
    "library_id_card_payment": {
        "phrases": [
            "Library ID payment",
            "pay for library id",
            "library id payment",
            "how much is library id",
            "bayad sa library id",
            "presyo sa library id",
            "pila ang bayad sa library id"
        ],
        "strong_keywords": [
            "payment", "pay", "how much", "bayad", 
            "presyo", "cost", "price", "pila"
        ],
        "weak_keywords": ["library", "id", "card", "for"],
        "required_context": ["library_id"]
    },
    "borrow_books": {
        "phrases": [
            "How to borrow books",
            "how do i borrow books",
            "borrow books",
            "how to borrow",
            "borrow a books",
            "hulam og libro",
            "how can i borrow some books on the library"
        ],
        "strong_keywords": ["borrow", "hulam"],
        "weak_keywords": ["books", "how", "libro", "some"],
        "required_context": []
    },
    "return_books": {
        "phrases": [
            "How to return books",
            "how do i return books",
            "return books",
            "uli sa libro",
            "how can i return some books",
            "book return"
        ],
        "strong_keywords": ["return", "uli", "returnment", "paguli"],
        "weak_keywords": ["books", "how", "libro", "some"],
        "required_context": []
    },
    "available_books": {
        "phrases": [
            "What books can I borrow",
            "available books",
            "are there books",
            "naa bay libro",
            "book available",
            "libro nga available",
            "libro nga pwedi ma hulman",
            "what books are available",
            "books that is available in the library",
            "what books possibly i can borrow"
        ],
        "strong_keywords": ["available", "list", "naa", "pwedi", "ma hulman", "mahulman", "borrowed"],
        "weak_keywords": ["books", "libro", "there", "are", "possibly", "can"],
        "required_context": []
    },
    "access_buksu_library_resources": {
        "phrases": [
            "Access library resources",
            "how do student can access the library resources",
            "can you tell me how could i access the university library resources",
            "whats do i need to access the library resources in buksu",
            "ang student ba pwedi maka access sa library resources",
            "pwedi ko nimo storyahan unsaon nako pag access sa university library resources",
            "unsaon pag access sa library resources"
        ],
        "strong_keywords": ["access", "resources"],
        "weak_keywords": ["can", "i", "pwedi", "maka"],
        "required_context": []
    }
}