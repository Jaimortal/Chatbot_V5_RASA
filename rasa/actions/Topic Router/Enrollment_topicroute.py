# This file stores enrollment-related topics and tools commonly used during enrollment.
# Some topics may overlap with admission or academic processes, but if they are mainly used
# during enrollment, they are intentionally grouped here.
# Admission-specific concerns should remain in their own merge file.

ENROLLMENT_INFO_TOPIC_PATTERNS = {

    "transferee_enrollment": {
        "phrases": [
            "transferee enrollment",
            "transfer to BukSU",
            "transferring from another school",
            "enrollment for transferee students",
            "mobalhin sa BukSU",
            "how to transfer to BukSU",
            "requirements for transferee",
            "can I transfer to BukSU",
            "transferee from private school",
            "transferee from public school"
        ],
        "strong_keywords": [
            "transferee", "transfer", "transferring", "mobalhin",
            "private school", "public school",
            "credited", "credit", "subjects credited",
            "honorable dismissal", "academic records"
        ],
        "weak_keywords": [
            "enrollment", "requirements", "student", "process", "buksu"
        ],
        "required_context": []
    },

    "student_fees": {
        "phrases": [
            "student fees",
            "fees during enrollment",
            "bayranan sa enrollment",
            "required fees at BukSU",
            "how much are the fees",
            "what do I need to pay",
            "do I need to pay anything",
            "payment for enrollment",
            "tuition and miscellaneous fees"
        ],
        "strong_keywords": [
            "fees", "fee", "bayranan", "tuition",
            "miscellaneous", "laboratory", "lab fee",
            "id fee", "payment", "bayad", "charges",
            "accounting", "cost", "gasto", "textbooks",
            "equipment", "materials"
        ],
        "weak_keywords": [
            "enrollment", "student", "semester", "required", "buksu"
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
            "how to open SIAS",
            "how to login to SIAS",
            "where is SIAS",
            "sias link",
            "student portal"
        ],
        "strong_keywords": [
            "sias", "portal", "login", "credentials", "account",
            "username", "password", "access", "website", "link"
        ],
        "weak_keywords": [
            "student", "grades", "record", "buksu", "help"
        ],
        "required_context": []
    },

    "campus_transfer": {
        "phrases": [
            "transfer campus",
            "another campus",
            "move to different campus",
            "mobalhin sa lain nga campus",
            "can I transfer to another campus",
            "campus shifting",
            "balhin campus"
        ],
        "strong_keywords": [
            "another campus", "different campus",
            "campus transfer", "campus shifting",
            "mobalhin campus", "lain nga campus",
            "balhin campus"
        ],
        "weak_keywords": [
            "campus", "transfer", "move", "possible", "semester", "buksu"
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
            "can I enroll in two schools at the same time",
            "can I study in two schools"
        ],
        "strong_keywords": [
            "double enrollment", "dual enrollment",
            "two schools", "two universities",
            "same time enrollment", "simultaneous enrollment",
            "duha ka eskwelahan", "honorable dismissal", "withdraw first"
        ],
        "weak_keywords": [
            "enroll", "school", "university", "college",
            "allowed", "permitted", "another"
        ],
        "required_context": []
    },

    "enrollment_general_process": {
        "phrases": [
            "how to enroll in BukSU",
            "enrollment process",
            "unsaon pag enroll sa BukSU",
            "how does enrollment work",
            "general enrollment guide",
            "how to start enrollment",
            "unsa ang proseso sa enrollment",
            "how is BukSU enrollment done"
        ],
        "strong_keywords": [
            "how to enroll", "enrollment process",
            "how does enrollment work", "start enrollment",
            "unsaon pag enroll", "proseso sa enrollment",
            "general enrollment"
        ],
        "weak_keywords": [
            "enrollment", "process", "guide", "registration",
            "college", "department", "online", "onsite", "buksu"
        ],
        "required_context": []
    },

    "online_enrollment_steps": {
        "phrases": [
            "online enrollment steps",
            "step by step online enrollment BukSU",
            "how to enroll online BukSU",
            "steps para sa online enrollment",
            "online enrollment procedure",
            "how to apply online",
            "how to use BukSU admissions for enrollment",
            "where do I apply for enrollment",
            "Online Enrollment",
            "Online Enrollment Steps"
        ],
        "strong_keywords": [
            "online enrollment", "enroll online",
            "online procedure", "online steps",
            "step by step", "apply online",
            "buksu admissions", "apply enrollment",
            "enrollment tab", "fill in details", "download cor"
        ],
        "weak_keywords": [
            "website", "portal", "fill up", "upload",
            "form", "application", "process", "buksu", "admissions"
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
            "what to do after online enrollment",
            "do I still need to go to the department"
        ],
        "strong_keywords": [
            "face to face enrollment", "onsite enrollment",
            "mixed enrollment", "in person enrollment",
            "physical enrollment", "after online enrollment",
            "go to department", "pending online enrollment",
            "queue system", "faculty staff", "scan queue",
            "enroll face to face"
        ],
        "weak_keywords": [
            "department", "queue", "scan", "faculty", "enroll",
            "staff", "proceed", "continue", "linya", "moadto",
            "face to face"
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
            "what are the enrollment requirements",
            "what documents do I need",
            "unsa akong dad-on para enroll"
        ],
        "strong_keywords": [
            "documents", "document", "requirements",
            "dokumento", "papeles", "what to bring",
            "dad-on", "bring", "birth certificate",
            "report card", "form 138", "ror",
            "application form", "lrn", "diploma",
            "good moral", "photocopy"
        ],
        "weak_keywords": [
            "freshman", "continuing", "enrollment", "student",
            "required", "school", "buksu", "2nd semester"
        ],
        "required_context": []
    },

}