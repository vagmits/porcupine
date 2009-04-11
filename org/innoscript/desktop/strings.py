# -*- coding: utf-8 -*-
"Porcupine Desktop String Resources"
from porcupine.config.resources import ResourceStrings, Locale

resources = ResourceStrings({
    '*' : Locale({
        # classes
        'org.innoscript.desktop.schema.common.Folder' : 'Folder',
        'org.innoscript.desktop.schema.collab.ContactsFolder' : 'Contacts folder',
        'org.innoscript.desktop.schema.collab.Contact' : 'Contact',
        'org.innoscript.desktop.schema.common.Document' : 'File',
        'org.innoscript.desktop.schema.common.PersonalFolder' : 'User\'s folder',
        'org.innoscript.desktop.schema.common.Category' : 'Category',
        'org.innoscript.desktop.schema.security.User' : 'User',
        'org.innoscript.desktop.schema.security.Group' : 'Group',
        'org.innoscript.desktop.schema.security.Policy' : 'Policy',
        'org.innoscript.desktop.schema.common.Application' : 'Application',
        'porcupine.systemObjects.Shortcut' : 'Shortcut',

        # schema attributes
        'displayName' : 'Name',
        'description' : 'Description',
        'file' : 'File',
        'documents' : 'Documents',
        'document_categories' : 'Categories',
        'memberof' : 'Member of',
        'password' : 'Password',
        'categories' : 'Categories',
        'category_objects' : 'Items',
        'members' : 'Members',
        'contact_categories' : 'Categories',
        'company' : 'Company',
        'email' : 'e-mail',
        'policies' : 'Policies',
        'policyGranted' : 'Granted to',
        'fullName' : 'Full name',
        'target' : 'Target',
        'shortcuts' : 'Shortcuts',
        
        # strings
        'FILE' : 'File',
        'EDIT' : 'Edit',
        'OPTIONS' : 'Options',
        'INFO' : 'Info',
        'DELETE' : 'Delete',
        'PROPERTIES' : 'Properties',
        'EXIT' : 'Exit',
        'REFRESH' : 'Refresh',
        'FILTER' : 'Filter',
        'CREATE' : 'Create',
        'UPDATE' : 'Update',
        'BACK' : 'Back',
        
        'MY_REPOSITORY' : 'My Repository',
        'APPLICATIONS' : 'Applications',
        'SETTINGS' : 'Settings',
        'START' : 'Start',
        
        'TASK_BAR' : 'Task bar',
        'TASK_BAR_POSITION' : 'Task bar position',
        'AUTO_RUN' : 'Auto run',
        'RUN_MAXIMIZED' : 'Run maximized',
        'NONE_APP' : 'None',
        'TOP' : 'Top',
        'BOTTOM' : 'Bottom',
        'APPLY' : 'Apply',
        
        'RECYCLE_BIN' : 'Recycle Bin',
        'EMPTY_BIN' : 'Empty Bin',
        'EMPTY_BIN_Q' : 'Are you sure you want to empty the recycle bin?',
        'ORIGINAL_LOC' : 'Original location',
        'SIZE' : 'Size',

        'OK' : 'OK',
        'CANCEL' : 'Cancel',
        'CLOSE' : 'Close',
        'FROM' : 'from',
        'TO' : 'to',
        
        'LOGIN_FAILED' : 'Invalid login parameters. Please try again.',
        'LOGIN_FAILED_TITLE' : 'Login failed',
        'LOGIN' : 'Login',
        'LOGOFF' : 'Logoff',
        'LOGIN_AS' : 'Login as...',
        'LOGOFF_Q' : 'Are you sure you want to logoff?',
        'YES' : 'Yes',
        'NO' : 'No',
        'MOVE' : 'Move',
        'COPY' : 'Copy',
        'COPYTO' : 'Copy to',
        'CUT' : 'Cut',
        'PASTE' : 'Paste',
        'SELECT_FOLDER' : 'Select folder',
        'RENAME' : 'Rename',
        'RESTORE' : 'Restore',
        'RESTORE_TO' : 'Restore to',
        'ENTER_NEW_NAME' : 'Enter new name',

        'NAME' : 'Name',
        'TITLE_NEW' : 'Add new ',
        'REQUIRED' : 'Required field',
        'NO_PERMISSION' : 'You do not have permission to create items in this folder.',
        'SECURITY' : 'Security',
        'USER_OR_GROUP' : 'User or Group',
        'ROLE' : 'Role',
        'ROLES_INHERITED' : 'Roles are inherited',
        'ROLE_1' : 'Reader',
        'ROLE_2' : 'Author',
        'ROLE_4' : 'Content coordinator',
        'ROLE_8' : 'Coordinator',
        'CLASS' : 'Class',
        'ID' : 'Object ID',
        'GENERAL' : 'General',

        'FOLDERS' : 'Folders',
        'ORDERBY' : 'Order results by',
        'TYPE' : 'Type',
        'DATEMOD' : 'Date modified',
        'DATEDEL' : 'Date deleted',
        'MODIFIEDBY' : 'Modified by',
        'DELETEDBY' : 'Deleted by',
        'INCLUDESUBS' : 'Include subfolders',
        'ADD' : 'Add',
        'REMOVE' : 'Remove',
        'SEARCH' : 'Search',
        'UP_ONE_FOLDER' : 'Up',
        
        'NEW_APP' : 'New Application',
        'ICON' : 'Icon',
        'LAUNCH_URL' : 'Launch URL',
        'SELECT_OBJECTS' : 'Select objects',
        'SELECT' : 'Select',
        'RESET_PASSWORD_FOR_USER' : 'Reset password for user',
        'ENTER_NEW_PASSWORD' : 'Enter new password',
        'REENTER_PASSWORD' : 'Re-enter password',
        'USER' : 'User',
        'PASSWORD' : 'Password',
        
        #HyperSearch
        'SEARCH_IN' : 'Search in',
        'ALL_OR_PART_OF_THE_NAME': 'All or part of the name',
        'WORD_OR_PHRASE_IN_DESCRIPTION' : 'Word or phrase in description',
        'MODIFIED_WITHIN' : 'Modified within',
        'DONT_REMEMBER' : 'I don\'t remember',
        'LAST_WEEK' : 'Last week',
        'LAST_MONTH' : 'Last month',
        'SPECIFY_DATES' : 'Specify dates',
        'OPEN_CONTAINER' : 'Open container'
    }),
    'el' : Locale({
        # classes 
        'org.innoscript.desktop.schema.common.Folder' : 'Φάκελος',
        'org.innoscript.desktop.schema.collab.ContactsFolder' : 'Φάκελος επαφών',
        'org.innoscript.desktop.schema.collab.Contact' : 'Επαφή',
        'org.innoscript.desktop.schema.common.Document' : 'Έγγραφο',
        'org.innoscript.desktop.schema.common.PersonalFolder' : 'Φάκελος χρήστη',
        'org.innoscript.desktop.schema.common.Category' : 'Κατηγορία',
        'org.innoscript.desktop.schema.security.User' : 'Χρήστης',
        'org.innoscript.desktop.schema.security.Group' : 'Ομάδα',
        'org.innoscript.desktop.schema.security.Policy' : 'Πολιτική Ασφάλειας',
        'org.innoscript.desktop.schema.common.Application' : 'Εφαρμογή',
        'porcupine.systemObjects.Shortcut' : 'Συντόμευση',
        
        #schema attributes
        'displayName' : 'Όνομα',
        'description' : 'Περιγραφή',
        'file' : 'Αρχείο',
        'documents' : 'Έγγραφα',
        'document_categories' : 'Κατηγορίες',
        'memberof' : 'Μέλος των',
        'password' : 'Κωδικός',
        'categories' : 'Κατηγορίες',
        'category_objects' : 'Αντικείμενα',
        'members' : 'Μέλη',
        'contact_categories' : 'Κατηγορίες',
        'company' : 'Εταιρεία',
        'email' : 'e-mail',
        'policies' : 'Πολιτικές ασφαλείας',
        'policyGranted' : 'Αποδόθηκε στους',
        'fullName' : 'Ονοματεπώνυμο',
        'target' : 'Προορισμός',
        'shortcuts' : 'Συντομεύσεις',
        
        # strings
        'FILE' : 'Αρχείο',
        'EDIT' : 'Επεξεργασία',
        'OPTIONS' : 'Επιλογές',
        'INFO' : 'Πληροφορίες',
        'EXIT' : 'Έξοδος',
        'PROPERTIES' : 'Ιδιότητες',
        'DELETE' : 'Διαγραφή',
        'REFRESH' : 'Ανανέωση',
        'FILTER' : 'Φίλτρο',
        'CREATE' : 'Δημιουργία',
        'UPDATE' : 'Ενημέρωση',
        'BACK' : 'Πίσω',
        
        'MY_REPOSITORY' : 'Ο αποθηκευτικός μου χώρος',
        'APPLICATIONS' : 'Εφαρμογές',
        'SETTINGS' : 'Ρυθμίσεις',
        'START' : 'Έναρξη',
        
        'TASK_BAR' : 'Γραμμή εργασιών',
        'TASK_BAR_POSITION' : 'Θέση γραμμής εργασιών',
        'AUTO_RUN' : 'Αυτόματη εκκίνηση',
        'RUN_MAXIMIZED' : 'Εκτέλεση σε πλήρη οθόνη',
        'NONE_APP' : 'Καμμία',
        'TOP' : 'Επάνω',
        'BOTTOM' : 'Κάτω',
        'APPLY' : 'Εφαρμογή',
        
        'RECYCLE_BIN' : 'Κάδος Ανακύκλωσης',
        'EMPTY_BIN' : 'Άδειασμα Κάδου',
        'EMPTY_BIN_Q' : 'Είστε σίγουροι ότι θέλετε να αδειάσετε τον κάδο ανακύκλωσης;',
        'ORIGINAL_LOC' : 'Αρχική τοποθεσία',
        'SIZE' : 'Μέγεθος',
        'OK' : 'Εντάξει',
        'CANCEL' : 'Άκυρο',
        'CLOSE' : 'Κλείσιμο',
        'FROM' : 'από',
        'TO' : 'έως',

        'LOGIN_FAILED' : 'Μη έγκυρα στοιχεία εισόδου. Προσπαθείστε ξανά.',
        'LOGIN_FAILED_TITLE' : 'Αποτυχημένη προσπάθεια σύνδεσης',
        'LOGIN' : 'Είσοδος',
        'LOGOFF' : 'Αποσύνδεση',
        'LOGIN_AS' : 'Σύνδεση ως...',
        'LOGOFF_Q' : 'Είστε σίγουροι ότι θέλετε να αποσυνδεθείτε;',
        'YES' : 'Ναι',
        'NO' : 'Όχι',
        'MOVE' : 'Μετακίνηση',
        'COPY' : 'Αντιγραφή',
        'CUT' : 'Αποκοπή',
        'PASTE' : 'Επικόλληση',
        'COPYTO' : 'Αντιγραφή σε',
        'SELECT_FOLDER' : 'Επιλέξτε φάκελο',
        'RENAME' : 'Μετονομασία',
        'RESTORE' : 'Επαναφορά',
        'RESTORE_TO' : 'Επαναφορά σε',
        'ENTER_NEW_NAME' : 'Εισάγετε νέο όνομα',
        'NAME' : 'Όνομα',
        'TITLE_NEW' : 'Προσθήκη νέου αντικειμένου τύπου',
        'REQUIRED' : 'Απαιτούμενο πεδίο',
        'NO_PERMISSION' : 'Δεν έχετε δικαίωμα να δημιουργήσετε αντικείμενα κάτω από αυτόν το φάκελο.',
        'SECURITY' : 'Ασφάλεια',
        'USER_OR_GROUP' : 'Χρήστης ή Ομάδα',
        'ROLE' : 'Ρόλος',
        'ROLES_INHERITED' : 'Οι ρόλοι κληρονομούνται',
        'ROLE_1' : 'Αναγνώστης',
        'ROLE_2' : 'Συγγραφέας',
        'ROLE_4' : 'Συντονιστής περιεχομένου',
        'ROLE_8' : 'Συντονιστής',
        'CLASS' : 'Κλάση',
        'ID' : 'ID Αντικειμένου',
        'GENERAL' : 'Γενικά',
        'FOLDERS' : 'Φάκελοι',
        'ORDERBY' : 'Ταξινόμιση αποτελεσμάτων κατά',
        'TYPE' : 'Τύπο',
        'DATEMOD' : 'Ημ/νία τροποποίησης',
        'DATEDEL' : 'Ημ/νία διαγραφής',
        'MODIFIEDBY' : 'Τροποποιήθηκε από',
        'DELETEDBY' : 'Διαγράφηκε από',
        'INCLUDESUBS' : 'Να συμπεριληφθούν οι υποφάκελοι',
        'ADD' : 'Προσθήκη',
        'REMOVE' : 'Αφαίρεση',
        'SEARCH' : 'Αναζήτηση',
        'UP_ONE_FOLDER' : 'Πάνω',

        
        'NEW_APP' : 'Νέα εφαρμογή',
        'ICON' : 'Εικονίδιο',
        'LAUNCH_URL' : 'URL εκκίνησης',
        'SELECT_OBJECTS' : 'Επιλογή αντικειμένων',
        'SELECT' : 'Επιλογή',
        'RESET_PASSWORD_FOR_USER' : 'Αλλαγή κωδικού για τον χρήστη',
        'ENTER_NEW_PASSWORD' : 'Νέος κωδικός',
        'REENTER_PASSWORD' : 'Επαλήθευση κωδικού',
        'USER' : 'Χρήστης',
        'PASSWORD' : 'Κωδικός',
        
        #HyperSearch
        'SEARCH_IN' : 'Αναζήτηση μέσα στο',
        'ALL_OR_PART_OF_THE_NAME': 'Όλο ή μέρος του ονόματος',
        'WORD_OR_PHRASE_IN_DESCRIPTION' : 'Λέξη ή φράση στην περιγραφή',
        'MODIFIED_WITHIN' : 'Τροποποιήθηκε',
        'DONT_REMEMBER' : 'δεν θυμάμαι',
        'LAST_WEEK' : 'την τελευταία βδομάδα',
        'LAST_MONTH' : 'τον τελευταίο μήνα',
        'SPECIFY_DATES' : 'προσδιορισμός διαστήματος',
        'OPEN_CONTAINER' : 'Άνοιγμα φακέλου που περιέχεται'
    })
})