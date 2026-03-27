package setting

// SettingResponse is the payload returned to frontend.
type SettingResponse struct {
	ID          string `json:"id"`
	Category    string `json:"category,omitempty"`
	Key         string `json:"key"`
	Value       string `json:"value"`
	Label       string `json:"label,omitempty"`
	Type        string `json:"type,omitempty"`
	Description string `json:"description,omitempty"`
	Editable    bool   `json:"editable"`
	UpdatedAt   string `json:"updated_at,omitempty"`
	UpdatedBy   string `json:"updated_by,omitempty"`
}

// UpdateSettingRequest updates a setting value.
type UpdateSettingRequest struct {
	Value string `json:"value" binding:"required"`
}

// BatchUpdateRequest batch updates multiple settings.
type BatchUpdateRequest struct {
	Updates map[string]string `json:"updates" binding:"required"`
}
