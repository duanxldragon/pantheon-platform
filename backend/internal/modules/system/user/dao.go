package user

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"pantheon-platform/backend/internal/shared/database"
)

// UserRepository defines user DAO behavior.
type UserRepository interface {
	database.DAO[User]
	database.TenantMigrator
	GetByUsername(ctx context.Context, username string) (*User, error)
	GetByEmail(ctx context.Context, email string) (*User, error)
	GetByPhone(ctx context.Context, phone string) (*User, error)
	UpdateStatus(ctx context.Context, id string, status string) error
	UpdateLastLogin(ctx context.Context, id string, ip string) error

	AssignRole(ctx context.Context, userID, roleID string) error
	RemoveRole(ctx context.Context, userID, roleID string) error
	ClearRoles(ctx context.Context, userID string) error
	GetRoles(ctx context.Context, userID string) ([]*UserRoleInfo, error)
	BatchGetRoles(ctx context.Context, userIDs []string) (map[string][]*UserRoleInfo, error)

	AssignDepartment(ctx context.Context, userID, departmentID string) error
	RemoveDepartment(ctx context.Context, userID string) error
	AssignPosition(ctx context.Context, userID, positionID string) error
	RemovePosition(ctx context.Context, userID string) error
	CheckRoleInUse(ctx context.Context, roleID string) (bool, error)
	ListUserIDsByDepartmentIDs(ctx context.Context, departmentIDs []string) ([]string, error)
	ListUserIDsByPositionID(ctx context.Context, positionID string) ([]string, error)
}

// UserRoleInfo stores lightweight role information for a user.
type UserRoleInfo struct {
	ID   string
	Name string
}

// userRepository implements user DAO behavior.
type userRepository struct {
	*database.BaseDAO[User]
}

// NewUserRepository creates a user repository.
func NewUserRepository(db *gorm.DB) UserRepository {
	return &userRepository{
		BaseDAO: database.NewBaseDAO[User](db),
	}
}

func (r *userRepository) GetTenantModels() []interface{} {
	return []interface{}{
		&User{},
		&UserRole{},
	}
}

func (r *userRepository) GetByUsername(ctx context.Context, username string) (*User, error) {
	var u User
	err := r.GetDB(ctx).Where("username = ?", username).First(&u).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("user not found")
		}
		return nil, err
	}
	return &u, nil
}

func (r *userRepository) GetByEmail(ctx context.Context, email string) (*User, error) {
	var u User
	err := r.GetDB(ctx).Where("email = ?", email).First(&u).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("user not found")
		}
		return nil, err
	}
	return &u, nil
}

func (r *userRepository) GetByPhone(ctx context.Context, phone string) (*User, error) {
	var u User
	err := r.GetDB(ctx).Where("phone = ?", phone).First(&u).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("user not found")
		}
		return nil, err
	}
	return &u, nil
}

func (r *userRepository) UpdateStatus(ctx context.Context, id string, status string) error {
	return r.GetDB(ctx).Model(&User{}).Where("id = ?", id).Update("status", status).Error
}

func (r *userRepository) UpdateLastLogin(ctx context.Context, id string, ip string) error {
	return r.GetDB(ctx).Model(&User{}).Where("id = ?", id).
		Updates(map[string]interface{}{
			"last_login_at": gorm.Expr("NOW()"),
			"last_login_ip": ip,
		}).Error
}

func (r *userRepository) AssignRole(ctx context.Context, userID, roleID string) error {
	uUUID, _ := uuid.Parse(userID)
	rUUID, _ := uuid.Parse(roleID)
	ur := &UserRole{
		ID:     uuid.New(),
		UserID: uUUID,
		RoleID: rUUID,
	}
	return r.GetDB(ctx).Create(ur).Error
}

func (r *userRepository) RemoveRole(ctx context.Context, userID, roleID string) error {
	return r.GetDB(ctx).Where("user_id = ? AND role_id = ?", userID, roleID).Delete(&UserRole{}).Error
}

func (r *userRepository) ClearRoles(ctx context.Context, userID string) error {
	return r.GetDB(ctx).Where("user_id = ?", userID).Delete(&UserRole{}).Error
}

func (r *userRepository) GetRoles(ctx context.Context, userID string) ([]*UserRoleInfo, error) {
	var roles []*UserRoleInfo
	err := r.GetDB(ctx).
		Table("system_roles").
		Select("system_roles.id, system_roles.name").
		Joins("JOIN system_user_roles ON system_roles.id = system_user_roles.role_id").
		Where("system_user_roles.user_id = ? AND system_roles.status = ?", userID, "active").
		Find(&roles).Error
	return roles, err
}

func (r *userRepository) BatchGetRoles(ctx context.Context, userIDs []string) (map[string][]*UserRoleInfo, error) {
	if len(userIDs) == 0 {
		return make(map[string][]*UserRoleInfo), nil
	}
	type Result struct {
		UserID string
		ID     string
		Name   string
	}
	var results []Result
	err := r.GetDB(ctx).
		Table("system_roles").
		Select("system_roles.id, system_roles.name, system_user_roles.user_id").
		Joins("JOIN system_user_roles ON system_roles.id = system_user_roles.role_id").
		Where("system_user_roles.user_id IN ? AND system_roles.status = ?", userIDs, "active").
		Find(&results).Error
	if err != nil {
		return nil, err
	}
	resMap := make(map[string][]*UserRoleInfo)
	for _, res := range results {
		resMap[res.UserID] = append(resMap[res.UserID], &UserRoleInfo{ID: res.ID, Name: res.Name})
	}
	return resMap, nil
}

func (r *userRepository) AssignDepartment(ctx context.Context, userID, departmentID string) error {
	return r.GetDB(ctx).Model(&User{}).Where("id = ?", userID).Update("department_id", departmentID).Error
}

func (r *userRepository) RemoveDepartment(ctx context.Context, userID string) error {
	return r.GetDB(ctx).Model(&User{}).Where("id = ?", userID).Update("department_id", nil).Error
}

func (r *userRepository) AssignPosition(ctx context.Context, userID, positionID string) error {
	return r.GetDB(ctx).Model(&User{}).Where("id = ?", userID).Update("position_id", positionID).Error
}

func (r *userRepository) RemovePosition(ctx context.Context, userID string) error {
	return r.GetDB(ctx).Model(&User{}).Where("id = ?", userID).Update("position_id", nil).Error
}

func (r *userRepository) CheckRoleInUse(ctx context.Context, roleID string) (bool, error) {
	var count int64
	err := r.GetDB(ctx).Model(&UserRole{}).Where("role_id = ?", roleID).Count(&count).Error
	return count > 0, err
}

func (r *userRepository) ListUserIDsByDepartmentIDs(ctx context.Context, departmentIDs []string) ([]string, error) {
	if len(departmentIDs) == 0 {
		return []string{}, nil
	}
	var ids []string
	err := r.GetDB(ctx).Model(&User{}).Where("department_id IN ?", departmentIDs).Pluck("id", &ids).Error
	return ids, err
}

func (r *userRepository) ListUserIDsByPositionID(ctx context.Context, positionID string) ([]string, error) {
	if positionID == "" {
		return []string{}, nil
	}
	var ids []string
	err := r.GetDB(ctx).Model(&User{}).Where("position_id = ?", positionID).Pluck("id", &ids).Error
	return ids, err
}

func (r *userRepository) WithTx(tx *gorm.DB) database.DAO[User] {
	return &userRepository{
		BaseDAO: database.NewBaseDAO[User](tx),
	}
}
