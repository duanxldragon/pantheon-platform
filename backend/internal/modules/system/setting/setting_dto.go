package setting

// SettingResponse is the payload returned to frontend.
type SettingResponse struct {
	ID          string `json:"id" example:"setting-site-name"`
	Category    string `json:"category,omitempty" example:"site"`
	Key         string `json:"key" example:"site_name"`
	Value       string `json:"value" example:"Pantheon Platform"`
	Label       string `json:"label,omitempty" example:"Platform Name"`
	Type        string `json:"type,omitempty" example:"string"`
	Description string `json:"description,omitempty" example:"Display name shown in the admin portal"`
	Editable    bool   `json:"editable" example:"true"`
	UpdatedAt   string `json:"updated_at,omitempty" example:"2026-03-30T12:00:00Z"`
	UpdatedBy   string `json:"updated_by,omitempty" example:"admin"`
}

// UpdateSettingRequest updates a setting value.
type UpdateSettingRequest struct {
	Value string `json:"value" binding:"required" example:"Pantheon Platform"`
}

// BatchUpdateRequest batch updates multiple settings.
type BatchUpdateRequest struct {
	Updates map[string]string `json:"updates" binding:"required" example:"site_name:Pantheon Platform,login_notice:Welcome back"`
}
