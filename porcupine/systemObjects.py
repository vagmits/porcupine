#==============================================================================
#   Copyright (c) 2005-2011, Tassos Koutsovassilis
#
#   This file is part of Porcupine.
#   Porcupine is free software; you can redistribute it and/or modify
#   it under the terms of the GNU Lesser General Public License as published by
#   the Free Software Foundation; either version 2.1 of the License, or
#   (at your option) any later version.
#   Porcupine is distributed in the hope that it will be useful,
#   but WITHOUT ANY WARRANTY; without even the implied warranty of
#   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#   GNU Lesser General Public License for more details.
#   You should have received a copy of the GNU Lesser General Public License
#   along with Porcupine; if not, write to the Free Software
#   Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
#==============================================================================
"""
System top-level Porcupine content classes.
Use these as base classes to create you own custom objects.

@see: L{org.innoscript.desktop.schema} module as a usage guideline.
"""
import time
import copy

from porcupine import context
from porcupine import db
from porcupine import exceptions
from porcupine import datatypes
from porcupine.core.objectSet import ObjectSet
from porcupine.utils import misc, permsresolver
from porcupine.core.compat import str, basestring


class _Shortcuts(datatypes.RelatorN):
    "Data type for keeping the shortcuts IDs that an object has"
    relCc = ('porcupine.systemObjects.Shortcut',)
    relAttr = 'target'
    cascadeDelete = True


class _TargetItem(datatypes.Relator1):
    "The object ID of the target item of the shortcut."
    relCc = ('porcupine.systemObjects.Item',)
    relAttr = 'shortcuts'
    isRequired = True

# deprecated datatype (used for backwards compatibility)
displayName = datatypes.RequiredString

#==============================================================================
# Porcupine server top level content classes
#==============================================================================


class Cloneable(object):
    """
    Adds cloning capabilities to Porcupine Objects.

    Adding I{Cloneable} to the base classes of a class
    makes instances of this class cloneable, allowing item copying.
    """
    def _copy(self, target, clear_inherited=False):
        clone = self.clone()
        if clear_inherited:
            clone.inheritRoles = False

        user = context.user
        clone._owner = user._id
        clone._created = time.time()
        clone.modifiedBy = user.displayName.value
        clone.modified = time.time()
        clone._pid = target._id

        db._db.handle_update(clone, None)
        db._db.put_item(clone)
        db._db.handle_post_update(clone, None)

        if self.isCollection:
            [child._copy(clone) for child in self.get_children()]

    def clone(self, dup_ext=True):
        """
        Creates an in-memory clone of the item.
        This is a shallow copy operation meaning that the item's
        references are not cloned.

        @param dup_ext: Boolean indicating if the external
                        files and external datatypes should be
                        also duplicated
        @type dup_ext: bool

        @return: the clone object
        @rtype: L{GenericItem}
        """
        clone = copy.deepcopy(self, {'_dup_ext_': dup_ext})
        clone._id = misc.generate_oid()
        return clone

    @db.requires_transactional_context
    def copy_to(self, target):
        """
        Copies the item to the designated target.

        @param target: The id of the target container or the container object
                       itself
        @type target: str OR L{Container}
        @return: None
        @raise L{porcupine.exceptions.ObjectNotFound}:
            If the target container does not exist.
        """
        if isinstance(target, (str, bytes)):
            target = db._db.get_item(target)

        if target is None or target._isDeleted:
            raise exceptions.ObjectNotFound(
                'The target container does not exist.')

        contentclass = self.get_contentclass()

        if self.isCollection and target.is_contained_in(self._id):
            raise exceptions.ContainmentError(
                'Cannot copy item to destination.\n'
                'The destination is contained in the source.')

        # check permissions on target folder
        user = context.user
        user_role = permsresolver.get_access(target, user)
        if not(self._isSystem) and user_role > permsresolver.READER:
            if contentclass not in target.containment:
                raise exceptions.ContainmentError(
                    'The target container does not accept '
                    'objects of type\n"%s".' % contentclass)

            self._copy(target, clear_inherited=True)
            # update parent
            if self.isCollection:
                target._nc += 1
            else:
                target._ni += 1
            target.modified = time.time()
            db._db.put_item(target)
        else:
            raise exceptions.PermissionDenied(
                'The object was not copied.\n'
                'The user has insufficient permissions.')


class Movable(object):
    """
    Adds moving capabilities to Porcupine Objects.

    Adding I{Movable} to the base classes of a class
    makes instances of this class movable, allowing item moving.
    """
    @db.requires_transactional_context
    def move_to(self, target):
        """
        Moves the item to the designated target.

        @param target: The id of the target container or the container object
                       itself
        @type target: str OR L{Container}
        @return: None
        @raise L{porcupine.exceptions.ObjectNotFound}:
            If the target container does not exist.
        """
        user = context.user
        user_role = permsresolver.get_access(self, user)
        can_move = (user_role > permsresolver.AUTHOR)
        ## or (user_role == permsresolver.AUTHOR and oItem.owner == user.id)

        parent_id = self._pid
        if isinstance(target, (str, bytes)):
            target = db._db.get_item(target)

        if target is None or target._isDeleted:
            raise exceptions.ObjectNotFound(
                'The target container does not exist.')

        contentclass = self.get_contentclass()

        user_role2 = permsresolver.get_access(target, user)

        if self.isCollection and target.is_contained_in(self._id):
            raise exceptions.ContainmentError(
                'Cannot move item to destination.\n'
                'The destination is contained in the source.')

        if (not(self._isSystem) and can_move and
                user_role2 > permsresolver.READER):
            if contentclass not in target.containment:
                raise exceptions.ContainmentError(
                    'The target container does not accept '
                    'objects of type\n"%s".' % contentclass)

            db._db.delete_item(self)
            self._pid = target._id
            self.inheritRoles = False
            self.modified = time.time()
            db._db.put_item(self)

            # update target
            if self.isCollection:
                target._nc += 1
            else:
                target._ni += 1
            target.modified = time.time()
            db._db.put_item(target)

            # update parent
            parent = db._db.get_item(parent_id)
            parent.modified = time.time()
            db._db.put_item(parent)
        else:
            raise exceptions.PermissionDenied(
                'The object was not moved.\n'
                'The user has insufficient permissions.')


class Removable(object):
    """
    Makes Porcupine objects removable.

    Adding I{Removable} to the base classes of a class
    makes instances of this type removable.
    Instances of this type can be either logically
    deleted - (moved to a L{RecycleBin} instance) - or physically
    deleted.
    """
    def _delete(self, _update_parent=True):
        """
        Deletes the item physically.

        @return: None
        """
        db._db.handle_delete(self, True)
        db._db.delete_item(self)

        if _update_parent and not self._isDeleted:
            # update container modification timestamp
            parent = db._db.get_item(self._pid)
            if parent is not None:
                # update parent
                if self.isCollection:
                    parent._nc -= 1
                else:
                    parent._ni -= 1
                parent.modified = time.time()
                db._db.put_item(parent)

        db._db.handle_post_delete(self, True)

        if self.isCollection:
            cursor = db._db.get_children(self._id)
            cursor.enforce_permissions = False
            [child._delete(False) for child in cursor]
            cursor.close()

    @db.requires_transactional_context
    def delete(self):
        """
        Deletes the item permanently.

        @return: None
        """
        user = context.user
        self_ = db._db.get_item(self._id)

        user_role = permsresolver.get_access(self_, user)
        can_delete = (user_role > permsresolver.AUTHOR) or \
            (user_role == permsresolver.AUTHOR and self_._owner == user._id)

        if (not(self_._isSystem) and can_delete):
            # delete item physically
            self_._delete()
        else:
            raise exceptions.PermissionDenied(
                'The object was not deleted.\n'
                'The user has insufficient permissions.')

    def _recycle(self, _update_parent=True):
        """
        Deletes an item logically.
        Bypasses security checks.

        @return: None
        """
        is_deleted = self._isDeleted

        if not is_deleted:
            db._db.handle_delete(self, False)
            db._db.delete_item(self)

        self._isDeleted = int(self._isDeleted) + 1
        db._db.put_item(self)

        if _update_parent:
            # update parent
            parent = db._db.get_item(self._pid)
            if self.isCollection:
                parent._nc -= 1
            else:
                parent._ni -= 1
            parent.modified = time.time()
            db._db.put_item(parent)

        if not is_deleted:
            db._db.handle_post_delete(self, False)

        if self.isCollection:
            cursor = db._db.get_children(self._id)
            cursor.enforce_permissions = False
            [child._recycle(False) for child in cursor]
            cursor.close()

    def _undelete(self, _update_parent=True):
        """
        Undeletes a logically deleted item.
        Bypasses security checks.

        @return: None
        """
        self._isDeleted = int(self._isDeleted) - 1
        if not self._isDeleted:
            db._db.handle_undelete(self)

        if _update_parent:
            # update container
            parent = db._db.get_item(self._pid)
            # update parent
            if self.isCollection:
                parent._nc += 1
            else:
                parent._ni += 1
            parent.modified = time.time()
            db._db.put_item(parent)

        if self.isCollection:
            cursor = db._db.get_children(self._id)
            cursor.enforce_permissions = False
            [child._undelete(False) for child in cursor]
            cursor.close()

        db._db.put_item(self)

    @db.requires_transactional_context
    def recycle(self, rb_id):
        """
        Moves the item to the specified recycle bin.
        The item then becomes inaccessible.

        @param rb_id: The id of the destination container, which must be
                      a L{RecycleBin} instance
        @type rb_id: str
        @return: None
        """
        user = context.user
        self_ = db._db.get_item(self._id)

        user_role = permsresolver.get_access(self_, user)
        can_delete = (user_role > permsresolver.AUTHOR) or \
                     (user_role == permsresolver.AUTHOR and
                      self_._owner == user._id)

        if (not(self_._isSystem) and can_delete):
            deleted = DeletedItem(self_)
            deleted._owner = user._id
            deleted._created = time.time()
            deleted.modifiedBy = user.displayName.value
            deleted.modified = time.time()
            deleted._pid = rb_id

            # check recycle bin's containment
            recycle_bin = db._db.get_item(rb_id)
            if deleted.get_contentclass() not in recycle_bin.containment:
                raise exceptions.ContainmentError(
                    'The target container does not accept '
                    'objects of type\n"%s".' % deleted.get_contentclass())

            db._db.handle_update(deleted, None)
            db._db.put_item(deleted)
            db._db.handle_post_update(deleted, None)

            # delete item logically
            self_._recycle()
        else:
            raise exceptions.PermissionDenied(
                'The object was not deleted.\n'
                'The user has insufficient permissions.')


class _Elastic(object):
    """
    Base class for all Porcupine objects.
    Accomodates schema updates without requiring database updates.
    The object schema is automatically updated the next time the
    object is written in the database.
    """
    __props__ = {}

    def __init__(self):
        [self.__getattr__(prop) for prop in self.__props__]
        self._ssig = hash(tuple(self.__props__.keys()))

    def __getattr__(self, name):
        if name in self.__props__:
            attr_type = self.__props__[name]
            if isinstance(attr_type, tuple):
                attr_type, args, kwargs = attr_type
            else:
                attr_type, args, kwargs = attr_type, [], {}
            attr = attr_type(*args, **kwargs)
            setattr(self, name, attr)
            return attr
        else:
            raise AttributeError("'%s' object has no attribute '%s'" %
                                 (self.__class__.__name__, name))

    def _update_schema(self):
        new_ssig = hash(tuple(self.__props__.keys()))
        if not hasattr(self, '_ssig') or self._ssig != new_ssig:
            item_schema = set([p for p in self.__dict__
                               if isinstance(self.__dict__[p],
                                             datatypes.DataType)])
            current_schema = set(self.__props__.keys())

            for_addition = current_schema - item_schema
            # add new attributes
            [self.__getattr__(x) for x in for_addition]
            # call event handlers
            [getattr(self, attr)._eventHandler.on_create(self,
                                                         getattr(self, attr))
             for attr in for_addition
             if getattr(self, attr)._eventHandler]

            for_removal = item_schema - current_schema
            # call event handlers
            [getattr(self, attr)._eventHandler.on_delete(self,
                                                         getattr(self, attr),
                                                         True)
             for attr in for_removal
             if getattr(self, attr)._eventHandler]
            # remove old attributes
            [delattr(self, x) for x in for_removal]

            self._ssig = new_ssig


class Composite(_Elastic):
    """Objects within Objects...

    Think of this as an embedded item. This class is useful
    for implementing compositions. Instances of this class
    are embedded into other items.
    Note that instances of this class have no
    security descriptor since they are embedded into other items.
    The L{security} property of such instances is actually a proxy to
    the security attribute of the object that embeds this object.
    Moreover, they do not have parent containers the way
    instances of L{GenericItem} have.

    @type contentclass: str
    @type id: str
    @type security: dict
    @see: L{porcupine.datatypes.Composition}
    """
    __image__ = "desktop/images/object.gif"
    __props__ = {'displayName': datatypes.RequiredString}
    _eventHandlers = []

    def __init__(self):
        self._id = misc.generate_oid()
        self._pid = None
        self._isDeleted = 0
        _Elastic.__init__(self)

    def get_security(self):
        """Getter of L{security} property

        @rtype: dict
        """
        return db._db.get_item(self._pid[1:]).security
    security = property(get_security)

    def get_id(self):
        """Getter of L{id} property

        @rtype: str
        """
        return self._id
    id = property(get_id)

    def get_contentclass(self):
        """Getter of L{contentclass} property

        @rtype: str
        """
        return '%s.%s' % (self.__class__.__module__, self.__class__.__name__)
    contentclass = property(get_contentclass)


class GenericItem(_Elastic):
    """Generic Item
    The base class of all Porcupine objects.

    @cvar __props__: A dict containing all the object's data types.
    @type __props__: dict
    @cvar _eventHandlers: A list containing all the object's event handlers.
    @type _eventHandlers: list
    @cvar isCollection: A boolean indicating if the object is a container.
    @type isCollection: bool
    @ivar modifiedBy: The display name of the last modifier.
    @type modifiedBy: str
    @ivar modified: The last modification date, handled by the server.
    @type modified: float
    @ivar security: The object's security descriptor. This is a dictionary
                    whose keys are the users' IDs and the values are the roles.
    @type security: dict
    @ivar inheritRoles: Indicates if the object's security
                        descriptor is identical to this of its parent
    @type inheritRoles: bool
    @ivar displayName: The display name of the object.
    @type displayName: L{RequiredString<porcupine.datatypes.RequiredString>}
    @ivar description: A short description.
    @type description: L{String<porcupine.datatypes.String>}
    @type contentclass: str
    @type created: float
    @type id: str
    @type issystem: bool
    @type owner: type
    @type parentid: str
    """
    __image__ = "desktop/images/object.gif"
    __props__ = {'displayName': datatypes.RequiredString,
                 'description': datatypes.String}
    isCollection = False
    _eventHandlers = []

    def __init__(self):
        # system props
        self._id = misc.generate_oid()
        self._pid = None
        self._owner = ''
        self._isSystem = False
        self._isDeleted = 0
        self._created = 0

        self.modifiedBy = ''
        self.modified = 0
        self.security = {}
        self.inheritRoles = True

        _Elastic.__init__(self)

    def _apply_security(self, parent, is_new):
        if parent is not None and self.inheritRoles:
            self.security = parent.security
        if self.isCollection and not is_new:
            cursor = db._db.get_children(self._id)
            cursor.enforce_permissions = False
            for child in cursor:
                child._apply_security(self, is_new)
                db._db.put_item(child)
            cursor.close()

    @db.requires_transactional_context
    def append_to(self, parent):
        """
        Adds the item to the specified container.

        @param parent: The id of the destination container or the container
                       itself
        @type parent: str OR L{Container}
        @return: None
        """
        if isinstance(parent, basestring):
            parent = db._db.get_item(parent)

        contentclass = self.get_contentclass()

        user = context.user
        user_role = permsresolver.get_access(parent, user)
        if user_role == permsresolver.READER:
            raise exceptions.PermissionDenied(
                'The user does not have write permissions '
                'on the parent folder.')
        if contentclass not in parent.containment:
            raise exceptions.ContainmentError(
                'The target container does not accept '
                'objects of type\n"%s".' % contentclass)

        # set security to new item
        if user_role == permsresolver.COORDINATOR:
            # user is COORDINATOR
            self._apply_security(parent, True)
        else:
            # user is not COORDINATOR
            self.inheritRoles = True
            self.security = parent.security

        self._owner = user._id
        self._created = time.time()
        self.modifiedBy = user.displayName.value
        self.modified = time.time()
        self._pid = parent._id

        db._db.handle_update(self, None)
        db._db.put_item(self)
        if self.isCollection:
            parent._nc += 1
        else:
            parent._ni += 1
        parent.modified = self.modified
        db._db.put_item(parent)
        db._db.handle_post_update(self, None)

    def is_contained_in(self, item_id):
        """
        Checks if the item is contained in the specified container.

        @param item_id: The id of the container
        @type item_id: str
        @rtype: bool
        """
        item = self
        while item._id != '':
            if item._id == item_id:
                return True
            item = db._db.get_item(item.parentid)
        return False

    def get_parent(self):
        """
        Returns the parent container

        @return: the parent container object
        @rtype: type
        """
        return db.get_item(self._pid)

    def get_all_parents(self):
        """
        Returns all the parents of the item traversing the
        hierarchy up to the root folder.

        @rtype: L{ObjectSet<porcupine.core.objectSet.ObjectSet>}
        """
        parents = []
        item = self
        while item and item._id:
            parents.append(item)
            item = item.get_parent()
        parents.reverse()
        return ObjectSet(parents)

    def get_contentclass(self):
        """Getter of L{contentclass} property

        @rtype: str
        """
        return '%s.%s' % (self.__class__.__module__, self.__class__.__name__)
    contentclass = property(get_contentclass, None, None,
                            "The type of the object")

    def get_id(self):
        """Getter of L{id} property

        @rtype: str
        """
        return self._id
    id = property(get_id, None, None, "The ID of the object")

    def get_is_system(self):
        """Getter of L{issystem} property

        @rtype: bool
        """
        return self._isSystem
    issystem = property(get_is_system, None, None,
                        "Indicates if this is a systemic object")

    def get_owner(self):
        """Getter of L{owner} property

        @rtype: type
        """
        return self._owner
    owner = property(get_owner, None, None, "The object's creator")

    def get_created(self):
        """Getter of L{created} property

        @rtype: float
        """
        return self._created
    created = property(get_created, None, None, "The creation date")

    def get_parent_id(self):
        """Getter of L{parentid} property

        @rtype: str
        """
        return self._pid
    parentid = property(get_parent_id, None, None,
                        "The ID of the parent container")

#==============================================================================
# Porcupine server system classes
#==============================================================================


class DeletedItem(GenericItem, Removable):
    """
    This is the type of items appended into a L{RecycleBin} class instance.

    L{RecycleBin} containers accept objects of this type only.
    Normally, you won't ever need to instantiate an item of this
    type. Instantiations of this class are handled by the server
    internally when the L{Removable.recycle} method is called.

    @ivar originalName: The display name of the deleted object.
    @type originalName: str
    @ivar originalLocation: The path to the location of the deleted item
                            before the deletion
    @type originalLocation: str
    """
    def __init__(self, deleted_item):
        GenericItem.__init__(self)

        self.inheritRoles = True
        self._deletedId = deleted_item._id
        self.__image__ = deleted_item.__image__

        self.displayName.value = misc.generate_oid()
        self.description.value = deleted_item.description.value

        parents = deleted_item.get_all_parents()
        full_path = '/'
        full_path += '/'.join([p.displayName.value for p in parents[:-1]])
        self.originalLocation = full_path
        self.originalName = deleted_item.displayName.value

    def _restore(self, deleted, target):
        """
        Restores a logically deleted item to the designated target.

        @return: None
        """
        # check permissions
        user = context.user
        user_role = permsresolver.get_access(target, user)

        if user_role > permsresolver.READER:
            deleted._pid = target._id
            deleted.inheritRoles = False
            deleted._undelete()
        else:
            raise exceptions.PermissionDenied(
                    'The user does not have write permissions on the '
                    'destination folder.')

    def get_deleted_item(self):
        """
        Use this method to get the item that was logically deleted.

        @return: the deleted item
        @rtype: L{GenericItem}
        """
        return db._db.get_item(self._deletedId)

    def append_to(self, *args, **kwargs):
        """
        Calling this method raises an ContainmentError.
        This is happening because you can not add a DeletedItem
        directly to the store.
        This type of item is added in the database only if
        the L{Removable.recycle} method is called.

        @warning: DO NOT USE.
        @raise L{porcupine.exceptions.ContainmentError}: Always
        """
        raise exceptions.ContainmentError(
            'Cannot directly add this item to the store.\n'
            'Use the "recycle" method instead.')

    @db.requires_transactional_context
    def restore(self):
        """
        Restores the deleted item to its original location, if
        it still exists.

        @return: None
        @raise L{porcupine.exceptions.ObjectNotFound}:
            If the original location or the original item no longer exists.
        """
        self.restore_to(None)

    @db.requires_transactional_context
    def restore_to(self, parent_id):
        """
        Restores the deleted object to the specified container.

        @param parent_id: The ID of the container in which
                          the item will be restored
        @type parent_id: str
        @return: None
        @raise L{porcupine.exceptions.ObjectNotFound}:
            If the original location or the original item no longer exists.
        """
        deleted = db._db.get_item(self._deletedId)
        if deleted is None:
            raise exceptions.ObjectNotFound(
                'Cannot locate original item.\n'
                'It seems that this item resided in a container\n'
                'that has been permanently deleted or it is shortcut\n'
                'having its target permanently deleted.')
        parent = db._db.get_item(parent_id or deleted._pid)
        if parent is None or parent._isDeleted:
            raise exceptions.ObjectNotFound(
                'Cannot locate target container.\n'
                'It seems that this container is deleted.')

        if isinstance(deleted, Shortcut):
            contentclass = deleted.get_target_contentclass()
        else:
            contentclass = deleted.get_contentclass()

        if contentclass and contentclass not in parent.containment:
            raise exceptions.ContainmentError(
                'The target container does not accept '
                'objects of type\n"%s".' % contentclass)

        if parent_id is not None and not isinstance(deleted, Shortcut):
            # restoring to a designated container
            deleted._isDeleted = 1

        if parent_id is not None and parent_id != deleted._pid:
            # restoring to a another container
            db._db.delete_item(deleted)
            deleted.modified = time.time()

        # try to restore original item
        self._restore(deleted, parent)
        # delete self
        self.delete(_remove_deleted=False)

    @db.requires_transactional_context
    def delete(self, _remove_deleted=True):
        """
        Deletes the deleted object permanently.

        @param _remove_deleted: Leave as is
        @return: None
        """
        Removable.delete(self)
        if _remove_deleted:
            # we got a direct call. remove deleted item
            deleted = db._db.get_item(self._deletedId)
            if deleted is not None:
                deleted._delete()


class Item(GenericItem, Cloneable, Movable, Removable):
    """
    Simple item with no versioning capabilities.

    Normally this is the base class of your custom Porcupine Objects
    if versioning is not required.
    Subclass the L{porcupine.systemObjects.Container} class if you want
    to create custom containers.
    """
    __props__ = dict({'shortcuts': _Shortcuts},
                     **GenericItem.__props__)

    @db.requires_transactional_context
    def update(self):
        """
        Updates the item.

        @return: None
        """
        old_item = db._db.get_item(self._id)
        if self._pid is not None:
            parent = db._db.get_item(self._pid)
        else:
            parent = None

        user = context.user
        user_role = permsresolver.get_access(old_item, user)

        if user_role > permsresolver.READER:
            # set security
            if user_role == permsresolver.COORDINATOR:
                # user is COORDINATOR
                if (self.inheritRoles != old_item.inheritRoles) or \
                        (not self.inheritRoles and \
                         self.security != old_item.security):
                    self._apply_security(parent, False)
            else:
                # restore previous ACL
                self.security = old_item.security
                self.inheritRoles = old_item.inheritRoles

            self.modifiedBy = user.displayName.value
            self.modified = time.time()

            db._db.handle_update(self, old_item)
            db._db.put_item(self)
            if parent is not None:
                parent.modified = self.modified
                db._db.put_item(parent)
            db._db.handle_post_update(self, old_item)
        else:
            raise exceptions.PermissionDenied(
                    'The user does not have update permissions.')


class Shortcut(Item):
    """
    Shortcuts act as pointers to other objects.

    When adding a shortcut in a container the containment
    is checked against the target's content class and
    the shortcut's itself.
    When deleting an object that has shortcuts all its
    shortcuts are also deleted. Likewise, when restoring
    the object all of its shortcuts are also restored to
    their original location.
    It is valid to have shortcuts pointing to shortcuts.
    In order to resolve the terminal target object use the
    L{get_target} method.
    """
    __image__ = "desktop/images/link.png"
    __props__ = dict({'target': _TargetItem},
                     **Item.__props__)

    @staticmethod
    def create(target):
        """Helper method for creating shortcuts of items.

        @param target: The id of the item or the item object itself
        @type parent: str OR L{Item}
        @return: L{Shortcut}
        """
        if isinstance(target, (str, bytes)):
            target = db._db.get_item(target)
        shortcut = Shortcut()
        shortcut.displayName.value = target.displayName.value
        shortcut.target.value = target._id
        return shortcut

    @db.requires_transactional_context
    def append_to(self, parent):
        if isinstance(parent, (str, bytes)):
            parent = db._db.get_item(parent)

        contentclass = self.get_target_contentclass()
        if contentclass not in parent.containment:
            raise exceptions.ContainmentError(
                'The target container does not accept '
                'objects of type\n"%s".' % contentclass)
        else:
            return super(Shortcut, self).append_to(parent)

    @db.requires_transactional_context
    def copy_to(self, target):
        if isinstance(target, (str, bytes)):
            target = db._db.get_item(target)

        contentclass = self.get_target_contentclass()
        if contentclass not in target.containment:
            raise exceptions.ContainmentError(
                'The target container does not accept '
                'objects of type\n"%s".' % contentclass)
        else:
            return super(Shortcut, self).copy_to(target)

    @db.requires_transactional_context
    def move_to(self, target):
        if isinstance(target, (str, bytes)):
            target = db._db.get_item(target)

        contentclass = self.get_target_contentclass()
        if contentclass not in target.containment:
            raise exceptions.ContainmentError(
                'The target container does not accept '
                'objects of type\n"%s".' % contentclass)
        else:
            return super(Shortcut, self).move_to(target)

    @db.requires_transactional_context
    def update(self):
        parent = db._db.get_item(self._pid)
        contentclass = self.get_target_contentclass()
        if contentclass not in parent.containment:
            raise exceptions.ContainmentError(
                'The parent container does not accept '
                'objects of type\n"%s".' % contentclass)
        else:
            return super(Shortcut, self).update()

    def get_target(self):
        """Returns the target item.

        @return: the target item or C{None} if the user
                 has no read permissions
        @rtype: L{Item} or NoneType
        """
        target = None
        if self.target.value:
            target = self.target.get_item()
            while target and isinstance(target, Shortcut):
                target = target.target.get_item()
        return target

    def get_target_contentclass(self):
        """Returns the content class of the target item.

        @return: the fully qualified name of the target's
                 content class
        @rtype: str
        """
        if self.target.value:
            target = db._db.get_item(self.target.value)
            while isinstance(target, Shortcut):
                target = db._db.get_item(target.target.value)
            return target.get_contentclass()


class Container(Item):
    """
    Generic container class.

    Base class for all containers. Containers do not support versioning.

    @cvar containment: a tuple of strings with all the content types of
                       Porcupine objects that this class instance can accept.
    @type containment: tuple
    @type isCollection: bool
    """
    __image__ = "desktop/images/folder.gif"
    containment = ('porcupine.systemObjects.Shortcut',)
    isCollection = True

    def __init__(self):
        Item.__init__(self)
        self._ni = 0
        self._nc = 0

    def child_exists(self, name):
        """
        Checks if a child with the specified name is contained
        in the container.

        @param name: The name of the child to check for
        @type name: str

        @rtype: bool
        """
        item = db._db.get_child_by_name(self._id, name)
        if item is None:
            return False
        else:
            return True

    def get_child_id(self, name):
        """
        Given a name this function returns the ID of the child.

        @param name: The name of the child
        @type name: str
        @return: The ID of the child if a child with the given name exists
                 else None.
        @rtype: str
        """
        child_id = None
        item = db._db.get_child_by_name(self._id, name)
        if item is not None:
            child_id = item._id
        return child_id

    def get_child_by_name(self, name):
        """
        This method returns the child with the specified name.

        @param name: The name of the child
        @type name: str
        @return: The child object if a child with the given name exists
                 else None.
        @rtype: L{GenericItem}
        """
        item = db._db.get_child_by_name(self._id, name)
        if item is not None:
            user_role = permsresolver.get_access(item, context.user)
            if user_role < permsresolver.READER:
                return None
        return item

    def get_children(self, resolve_shortcuts=False):
        """
        This method returns all the children of the container.

        @rtype: L{ObjectSet<porcupine.core.objectSet.ObjectSet>}
        """
        cursor = db._db.get_children(self._id)
        cursor.resolve_shortcuts = resolve_shortcuts
        children = ObjectSet([c for c in cursor])
        cursor.close()
        return children

    def get_items(self, resolve_shortcuts=False):
        """
        This method returns the children that are not containers.

        @rtype: L{ObjectSet<porcupine.core.objectSet.ObjectSet>}
        """
        conditions = (('isCollection', False), )
        cursor = db._db.query(conditions)
        cursor.set_scope(self._id)
        cursor.resolve_shortcuts = resolve_shortcuts
        items = ObjectSet([i for i in cursor])
        cursor.close()
        return items

    def get_subfolders(self, resolve_shortcuts=False):
        """
        This method returns the children that are containers.

        @rtype: L{ObjectSet<porcupine.core.objectSet.ObjectSet>}
        """
        conditions = (('isCollection', True), )
        cursor = db._db.query(conditions)
        cursor.set_scope(self._id)
        cursor.resolve_shortcuts = resolve_shortcuts
        subfolders = ObjectSet([f for f in cursor])
        cursor.close()
        return subfolders

    def has_children(self):
        """
        Checks if the container has at least one non-container child.

        @rtype: bool
        """
        return self._ni > 0

    def has_subfolders(self):
        """
        Checks if the container has at least one child container.

        @rtype: bool
        """
        return self._nc > 0

    def get_children_count(self):
        return self._ni + self._nc
    children_count = property(get_children_count, None, None,
                              "The total number of the container's children")

    def get_items_count(self):
        return self._ni
    items_count = property(get_items_count, None, None,
                           "The number of the items contained")

    def get_subfolders_count(self):
        return self._nc
    subfolders_count = property(get_subfolders_count, None, None,
                                "The number of containers contained")


class RecycleBin(Container):
    """
    Recycle bin class.

    By default every I{RecycleBin} class instance is a system item.
    It cannot be deleted, copied, moved or recycled.
    """
    __image__ = "desktop/images/trashcan_empty8.gif"
    containment = ('porcupine.systemObjects.DeletedItem', )

    def __init__(self):
        Container.__init__(self)
        self._isSystem = True

    @db.requires_transactional_context
    def empty(self):
        """
        This method empties the recycle bin.

        What this method actually does is to call the
        L{DeletedItem.delete} method for every
        L{DeletedItem} instance contained in the bin.

        @return: None
        """
        items = self.get_items()
        [item.delete() for item in items]
