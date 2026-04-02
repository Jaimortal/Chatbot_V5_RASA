# This is where all the enrollment related topic and other like tools that used during enrollment will be stored
# please be inform that theres other topics that is far more related to enrollment but we decide to store it on this file
# as we can tell it is still used during the enrollment, while the admission is not stored in here since admission has its own merge file
ENROLLMENT_INFO_TOPIC_PATTERNS = {

    "transferee_enrollment": {
        "phrases": [
            "transferee enrollment",
            "transfer to BukSU",
            "transferring from another school",
            "enrollment for transferee students",
            "mobalhin sa BukSU",
        ],
        "strong_keywords": [
            "transferee", "transfer", "transferring", "mobalhin",
            "institution", "private", "public", "credited",
            "ipasabot", "nagplano", "policy"
        ],
        "weak_keywords": [
            "enrollment", "enroll", "school", "university", "student",
            "students", "process", "buksu", "requirements"
        ],
        "required_context": []
    },

    "student_fees": {
        "phrases": [
            "student fees",
            "fees during enrollment",
            "bayranan sa enrollment",
            "required fees at BukSU",
        ],
        "strong_keywords": [
            "fees", "fee", "bayranan", "tuition", "laboratory",
            "miscellaneous", "textbooks", "equipment", "materials",
            "costs", "bayad", "pay", "payment", "accounting",
            "charges", "settle", "collected", "gasto", "dugang"
        ],
        "weak_keywords": [
            "enrollment", "student", "students", "university", "buksu",
            "semester", "course", "kurso", "required"
        ],
        "required_context": []
    },

    "access_sias": {
        "phrases": [
            "access sias",
            "sias portal",
            "login sias",
            "sias account",
            "ma access ang SIAS",
        ],
        "strong_keywords": [
            "sias", "portal", "login", "credentials", "account",
            "access", "maka", "moadto", "grado", "grades",
            "link", "website", "web"
        ],
        "weak_keywords": [
            "buksu", "student", "help", "tell", "tabangi"
        ],
        "required_context": []
    },

    "campus_transfer": {
        "phrases": [
            "transfer campus",
            "another campus",
            "move to different campus",
            "mobalhin sa lain nga campus",
        ],
        "strong_keywords": [
            "campus", "transfer", "mobalhin", "move",
            "another", "different", "lain", "possible",
            "posible", "semester"
        ],
        "weak_keywords": [
            "buksu", "student", "students", "university", "enroll"
        ],
        "required_context": []
    },

    "double_enrollment_policy": {
        "phrases": [
            "double enrollment",
            "dual enrollment",
            "enrolled in two schools",
            "studying at two universities",
            "naka-enroll sa duha ka eskwelahan",
        ],
        "strong_keywords": [
            "double", "dual", "simultaneously", "active",
            "allowed", "permitted", "gitugotan", "okay",
            "withdraw", "dismissal", "honorable", "currently",
            "parehas", "same", "time", "another"
        ],
        "weak_keywords": [
            "enrollment", "enroll", "school", "university", "college",
            "buksu", "student", "institution"
        ],
        "required_context": []
    },

    "enrollment_general_process": {
        "phrases": [
            "how to enroll in BukSU",
            "enrollment process",
            "unsaon pag enroll sa BukSU",
            "how does enrollment work",
            "online or face to face enrollment",
        ],
        "strong_keywords": [
            "how", "process", "work", "online", "face",
            "unsaon", "proseso", "giunsa", "enroll",
            "general", "kolehiyo", "college"
        ],
        "weak_keywords": [
            "enrollment", "buksu", "student", "students", "university"
        ],
        "required_context": []
    },

    "online_enrollment_steps": {
        "phrases": [
            "online enrollment steps",
            "step by step online enrollment BukSU",
            "how to enroll online BukSU admission",
            "steps para sa online enrollment sa BukSU admission",
        ],
        "strong_keywords": [
            "step", "steps", "guide", "admission", "website",
            "lakang", "COR", "LRN", "download", "fill",
            "pun-a", "apply", "click", "upload", "skip",
            "navigate", "process", "validate", "validation"
        ],
        "weak_keywords": [
            "online", "enrollment", "enroll", "buksu", "student",
            "university", "course"
        ],
        "required_context": []
    },

    "mixed_enrollment_process": {
        "phrases": [
            "face to face enrollment",
            "mixed enrollment",
            "onsite enrollment",
            "in person enrollment after online",
            "physical enrollment process",
            "face to face human sa online",
        ],
        "strong_keywords": [
            "face", "onsite", "physical", "person", "department",
            "queue", "scan", "faculty", "pending", "staff",
            "moadto", "linya", "numero", "turn", "proceed",
            "continue", "human", "after", "finish", "done",
            "sunod", "lakang", "iproseso"
        ],
        "weak_keywords": [
            "online", "enrollment", "enroll", "buksu", "student",
            "process", "registration", "university"
        ],
        "required_context": []
    },

    "enrollment_documents": {
        "phrases": [
            "enrollment documents",
            "documents needed for enrollment",
            "what to bring for enrollment",
            "requirements for freshman enrollment",
            "mga dokumento para sa enrollment",
        ],
        "strong_keywords": [
            "documents", "document", "dokumento", "bring", "dalhon",
            "freshman", "first-year", "requirements", "ROR",
            "birth", "certificate", "diploma", "moral",
            "application", "form", "report", "card", "LRN",
            "photocopy", "papeles", "continuing", "2nd"
        ],
        "weak_keywords": [
            "enrollment", "enroll", "buksu", "student", "university",
            "semester", "required", "school"
        ],
        "required_context": []
    },

}
