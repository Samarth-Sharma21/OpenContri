'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'

const popularLanguages = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust', 'C++', 'C#', 
  'PHP', 'Ruby', 'Swift', 'Kotlin', 'Dart', 'Shell', 'HTML', 'CSS'
]

const popularTopics = [
  'web', 'api', 'frontend', 'backend', 'react', 'vue', 'angular', 'nodejs',
  'machine-learning', 'ai', 'docker', 'kubernetes', 'aws', 'database',
  'mobile', 'cli', 'framework', 'library', 'tool', 'game', 'bot'
]

export default function FilterSidebar({ filters, onFiltersChange }) {
  const [tempTopic, setTempTopic] = useState('')

  const handleLanguageChange = (language) => {
    onFiltersChange({
      ...filters,
      language: language === 'all' ? '' : language
    })
  }

  const handleStarsChange = (field, value) => {
    onFiltersChange({
      ...filters,
      [field]: parseInt(value) || 0
    })
  }

  const addTopic = (topic) => {
    if (topic && !filters.topics.includes(topic)) {
      onFiltersChange({
        ...filters,
        topics: [...filters.topics, topic]
      })
    }
    setTempTopic('')
  }

  const removeTopic = (topic) => {
    onFiltersChange({
      ...filters,
      topics: filters.topics.filter(t => t !== topic)
    })
  }

  const clearAllFilters = () => {
    onFiltersChange({
      language: '',
      minStars: 0,
      maxStars: 100000,
      topics: []
    })
  }

  return (
    <Card className="sticky top-24 h-fit">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Filters</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearAllFilters}
            className="text-xs"
          >
            Clear All
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Language Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Language</Label>
          <Select 
            value={filters.language || 'all'} 
            onValueChange={handleLanguageChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              <SelectItem value="all">All Languages</SelectItem>
              {popularLanguages.map((lang) => (
                <SelectItem key={lang} value={lang}>
                  {lang}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stars Filter */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Stars Range</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">Min</Label>
              <Input
                type="number"
                placeholder="0"
                value={filters.minStars || ''}
                onChange={(e) => handleStarsChange('minStars', e.target.value)}
                min="0"
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Max</Label>
              <Input
                type="number"
                placeholder="100k"
                value={filters.maxStars === 100000 ? '' : filters.maxStars}
                onChange={(e) => handleStarsChange('maxStars', e.target.value || 100000)}
                min="0"
                className="h-8"
              />
            </div>
          </div>
        </div>

        {/* Topics Filter */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Topics</Label>
          
          {/* Current Topics */}
          {filters.topics.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {filters.topics.map((topic) => (
                <Badge key={topic} variant="secondary" className="text-xs">
                  {topic}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 ml-1 hover:bg-transparent"
                    onClick={() => removeTopic(topic)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}

          {/* Add Topic Input */}
          <div className="flex gap-1">
            <Input
              placeholder="Add topic..."
              value={tempTopic}
              onChange={(e) => setTempTopic(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addTopic(tempTopic)
                }
              }}
              className="h-8 text-xs"
            />
            <Button 
              size="sm" 
              onClick={() => addTopic(tempTopic)}
              disabled={!tempTopic}
              className="h-8 px-2"
            >
              Add
            </Button>
          </div>

          {/* Popular Topics */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Popular:</Label>
            <div className="flex flex-wrap gap-1">
              {popularTopics.slice(0, 8).map((topic) => (
                <Badge
                  key={topic}
                  variant={filters.topics.includes(topic) ? "default" : "outline"}
                  className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground"
                  onClick={() => {
                    if (filters.topics.includes(topic)) {
                      removeTopic(topic)
                    } else {
                      addTopic(topic)
                    }
                  }}
                >
                  {topic}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}